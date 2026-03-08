from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List
import sys
import os
import math
import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database import get_db
import models
from scoring_engine import FinancialHealthEngine

router = APIRouter()

class OnboardData(BaseModel):
    income: float
    expenses: Dict[str, float]
    quiz_answers: List[bool]
    language: str = "English"

class GoalData(BaseModel):
    name: str
    target_amount: float
    target_date: str

class UpdateAmountData(BaseModel):
    amount: float

class UpdateBudgetData(BaseModel):
    limit: float
    spent: float

class AddTransactionData(BaseModel):
    name: str
    category: str
    amount: float
    date: str = ""
    type: str = "expense"  # "expense" or "income"

def generate_mock_data_for_user(db: Session, session_id: str, income: float, expenses: Dict[str, float]):
    # Clean old
    db.query(models.Account).filter(models.Account.session_id == session_id).delete()
    db.query(models.Transaction).filter(models.Transaction.session_id == session_id).delete()
    db.query(models.Budget).filter(models.Budget.session_id == session_id).delete()

    # Create Accounts
    total_spent = sum(expenses.values())
    savings = income - total_spent if (income - total_spent) > 0 else 5000
    accounts = [
        models.Account(session_id=session_id, name="Primary Savings", type="Bank", balance=savings*2, icon="Building2", color="purple"),
        models.Account(session_id=session_id, name="Digital Wallet", type="Wallet", balance=2500, icon="Smartphone", color="teal"),
    ]
    db.add_all(accounts)

    # Convert expenses to budgets
    color_map = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"]
    icon_map = {"Housing": "Home", "Food": "Utensils", "Transport": "Car", "Shopping": "ShoppingBag", "Entertainment": "Film", "Savings": "PiggyBank", "Utilities": "Zap", "Debt/EMI": "Building2"}
    
    budgets = []
    idx = 0
    total_exp = 0
    for cat, amt in expenses.items():
        if amt > 0:
            c = color_map[idx % len(color_map)]
            icon = icon_map.get(cat, "PiggyBank")
            # Set the limit exactly to what the user inputted
            limit = amt 
            # Mock the spent amount to be slightly less so the budget bar looks good, 
            # or set spent = amt so limit is fully consumed? Let's assume they spent 80% of limit for mock feeling
            spent = round(amt * 0.8) 
            budgets.append(models.Budget(session_id=session_id, category=cat, limit=limit, spent=spent, icon=icon, color=c))
            idx += 1
            total_exp += spent
    db.add_all(budgets)

    # Transactions
    # Create the salary
    import datetime
    now = datetime.datetime.now()
    tx_date_str = now.strftime("%d %b %Y")
    
    transactions = [
        models.Transaction(session_id=session_id, name="Salary Credit", category="Income", amount=income, date=tx_date_str, status="Completed", icon="CreditCard"),
    ]
    
    # Create an initial transaction for each budget representing the spending they've already done
    idx = 0
    for cat, amt in expenses.items():
        if amt > 0:
            spent = round(amt * 0.8) 
            icon = icon_map.get(cat, "PiggyBank")
            if spent > 0:
                transactions.append(
                    models.Transaction(session_id=session_id, name=f"{cat} Spend", category=cat, amount=-spent, date=tx_date_str, status="Completed", icon=icon)
                )
    
    db.add_all(transactions)
    db.commit()

@router.get("/onboard/{session_id}")
def get_onboard_data(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess: raise HTTPException(status_code=404)
    return {
        "income": sess.income,
        "expenses": sess.expenses,
        "language": sess.language
    }

@router.post("/onboard/{session_id}")
def onboard_user(session_id: str, data: OnboardData, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess: raise HTTPException(status_code=404, detail="Not found")
    
    score, grade = FinancialHealthEngine.calculate_score(data.income, data.expenses)
    personality = FinancialHealthEngine.classify_personality(data.quiz_answers)

    sess.income = data.income
    sess.expenses = data.expenses
    sess.health_score = score
    sess.grade = grade
    sess.personality = personality
    sess.language = data.language
    sess.onboarded = True
    
    db.commit()
    generate_mock_data_for_user(db, session_id, data.income, data.expenses)
    
    return {"message": "Onboarding complete", "score": score, "grade": grade, "personality": personality}

@router.get("/dashboard/{session_id}")
def get_dashboard(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess: raise HTTPException(status_code=404)
    
    accounts = db.query(models.Account).filter(models.Account.session_id == session_id).all()
    total_balance = sum([a.balance for a in accounts])
    expenses = sess.expenses if sess.expenses else {}
    monthly_spending = sum(expenses.values())
    budgets = db.query(models.Budget).filter(models.Budget.session_id == session_id).all()
    category_colors = {b.category: b.color for b in budgets}
    
    import datetime
    
    transactions = db.query(models.Transaction).filter(models.Transaction.session_id == session_id).all()
    
    def get_last_6_months():
        res = []
        now = datetime.datetime.now()
        for i in range(5, -1, -1):
            m = now.month - i
            y = now.year
            if m <= 0:
                m += 12
                y -= 1
            dt = datetime.datetime(y, m, 1)
            res.append((dt.strftime("%b %Y"), dt.strftime("%b")))
        return res
        
    date_tuples = get_last_6_months()
    monthly_data = { f: {"month": s, "income": 0, "spending": 0} for f, s in date_tuples }
    
    now = datetime.datetime.now()
    curr_month = now.strftime("%b")
    curr_month_full = now.strftime("%b %Y")
    week_keys = [f"{curr_month} 1-7", f"{curr_month} 8-14", f"{curr_month} 15-21", f"{curr_month} 22-31"]
    weekly_dict = { w: {"week": w, "income": 0, "spending": 0} for w in week_keys }
    
    actual_spending_this_month = 0
    actual_income_this_month = 0
    
    for t in transactions:
        try:
            dt = datetime.datetime.strptime(t.date, "%d %b %Y")
            m_label_full = dt.strftime("%b %Y")
            
            amt = t.amount
            is_income = amt > 0
            abs_amt = abs(amt)
            
            if m_label_full in monthly_data:
                if is_income:
                    monthly_data[m_label_full]["income"] += abs_amt
                else:
                    monthly_data[m_label_full]["spending"] += abs_amt
                    cat = t.category
                    monthly_data[m_label_full][cat] = monthly_data[m_label_full].get(cat, 0) + abs_amt
            
            if m_label_full == curr_month_full:
                if is_income:
                    actual_income_this_month += abs_amt
                else:
                    actual_spending_this_month += abs_amt
                    
                day = dt.day
                w_label = f"{curr_month} 1-7" if day <= 7 else f"{curr_month} 8-14" if day <= 14 else f"{curr_month} 15-21" if day <= 21 else f"{curr_month} 22-31"
                
                if is_income:
                    weekly_dict[w_label]["income"] += abs_amt
                else:
                    weekly_dict[w_label]["spending"] += abs_amt
                    cat = t.category
                    weekly_dict[w_label][cat] = weekly_dict[w_label].get(cat, 0) + abs_amt
                    
        except Exception:
            pass

    spending_data = list(monthly_data.values())
    weekly_data = list(weekly_dict.values())
    current_income = actual_income_this_month if actual_income_this_month > 0 else sess.income
    monthly_spending = actual_spending_this_month

    return {
        "balance": float(total_balance),
        "income": current_income,
        "spending": float(monthly_spending),
        "health_score": float(sess.health_score),
        "grade": sess.grade,
        "personality": sess.personality,
        "onboarded": sess.onboarded,
        "category_colors": category_colors,
        "spending_data": spending_data,
        "weekly_data": weekly_data
    }

@router.post("/goals/{session_id}")
def create_goal(session_id: str, data: GoalData, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess: raise HTTPException(status_code=404)
    
    # Calculate weekly plan
    months = 3 # Simplification based on "3 months"
    try:
        if "month" in data.target_date.lower():
            months = int(data.target_date.lower().replace("months", "").replace("month", "").strip())
    except:
        months = 3
    
    weeks = months * 4
    weekly_amount = data.target_amount / weeks if weeks > 0 else data.target_amount
    weekly_plan = [{"week": i+1, "amount": round(weekly_amount, 2), "cumulative": round(weekly_amount * (i+1), 2)} for i in range(weeks)]

    new_goal = models.Goal(
        session_id=session_id,
        name=data.name,
        target_amount=data.target_amount,
        target_date=data.target_date,
        saved_amount=0.0,
        weekly_plan=weekly_plan
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return {"message": "Goal created", "goal_id": new_goal.id}

@router.get("/goals/{session_id}")
def get_goals(session_id: str, db: Session = Depends(get_db)):
    goals = db.query(models.Goal).filter(models.Goal.session_id == session_id).all()
    return [{
        "id": g.id,
        "name": g.name,
        "target_amount": g.target_amount,
        "target_date": g.target_date,
        "saved_amount": g.saved_amount,
        "weekly_plan": g.weekly_plan
    } for g in goals]

@router.delete("/goals/{session_id}/{goal_id}")
def delete_goal(session_id: str, goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.session_id == session_id, models.Goal.id == goal_id).first()
    if goal:
        db.delete(goal)
        db.commit()
    return {"message": "Deleted"}

@router.get("/accounts/{session_id}")
def get_accounts(session_id: str, db: Session = Depends(get_db)):
    accs = db.query(models.Account).filter(models.Account.session_id == session_id).all()
    return [{"id": a.id, "name": a.name, "type": a.type, "balance": a.balance, "icon": a.icon, "color": a.color, "status": a.status} for a in accs]

@router.put("/accounts/{session_id}/{account_id}")
def update_account(session_id: str, account_id: int, data: UpdateAmountData, db: Session = Depends(get_db)):
    acc = db.query(models.Account).filter(models.Account.session_id == session_id, models.Account.id == account_id).first()
    if acc:
        acc.balance = data.amount
        db.commit()
    return {"message": "Success"}

@router.get("/transactions/{session_id}")
def get_transactions(session_id: str, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.session_id == session_id).all()
    return [{"id": t.id, "name": t.name, "category": t.category, "amount": t.amount, "date": t.date, "status": t.status, "icon": t.icon} for t in tx]

@router.put("/transactions/{session_id}/{tx_id}")
def update_transaction(session_id: str, tx_id: int, data: UpdateAmountData, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.session_id == session_id, models.Transaction.id == tx_id).first()
    if tx:
        tx.amount = data.amount
        db.commit()
    return {"message": "Success"}

@router.get("/budgets/{session_id}")
def get_budgets(session_id: str, db: Session = Depends(get_db)):
    bds = db.query(models.Budget).filter(models.Budget.session_id == session_id).all()
    return [{"id": b.id, "category": b.category, "limit": b.limit, "spent": b.spent, "icon": b.icon, "color": b.color} for b in bds]

@router.put("/budgets/{session_id}/{budget_id}")
def update_budget(session_id: str, budget_id: int, data: UpdateBudgetData, db: Session = Depends(get_db)):
    bd = db.query(models.Budget).filter(models.Budget.session_id == session_id, models.Budget.id == budget_id).first()
    if bd:
        bd.limit = data.limit
        bd.spent = data.spent
        db.commit()
    return {"message": "Success"}

# ---- NEW: Add Transaction ----
@router.post("/transactions/{session_id}/add")
def add_transaction(session_id: str, data: AddTransactionData, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess: raise HTTPException(status_code=404)

    icon_map = {"Housing": "Home", "Food": "Coffee", "Transport": "Car", "Shopping": "ShoppingBag", 
                "Entertainment": "Film", "Savings": "PiggyBank", "Utilities": "Zap", "Debt/EMI": "Building2", "Income": "CreditCard"}
    icon = icon_map.get(data.category, "CreditCard")
    
    tx_date = data.date if data.date else datetime.datetime.now().strftime("%d %b %Y")
    amount = abs(data.amount) if data.type == "income" else -abs(data.amount)
    
    new_tx = models.Transaction(
        session_id=session_id,
        name=data.name,
        category=data.category,
        amount=amount,
        date=tx_date,
        status="Completed",
        icon=icon
    )
    db.add(new_tx)
    
    if data.type == "expense":
        budget = db.query(models.Budget).filter(
            models.Budget.session_id == session_id,
            models.Budget.category == data.category
        ).first()
        if budget:
            budget.spent = budget.spent + abs(data.amount)
    
    db.commit()
    db.refresh(new_tx)
    return {"message": "Transaction added", "id": new_tx.id}

# ---- NEW: Dynamic AI Budget Advice ----
@router.get("/budget-advice/{session_id}")
def get_budget_advice(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess: raise HTTPException(status_code=404)
    
    budgets = db.query(models.Budget).filter(models.Budget.session_id == session_id).all()
    if not budgets:
        return {"recommendations": ["No budget data to analyze yet. Complete onboarding first!"]}
    
    from llm_engine import LLMCoach
    
    budget_summary = "\n".join([f"- {b.category}: Spent Rs.{b.spent} of Rs.{b.limit} limit ({round(b.spent/b.limit*100)}% used)" for b in budgets])
    total_spent = sum(b.spent for b in budgets)
    total_limit = sum(b.limit for b in budgets)
    
    prompt = f"""Analyze my budget and give exactly 4 short money-saving tips.

My Budget:
{budget_summary}

Total: Rs.{total_spent} spent of Rs.{total_limit} ({round(total_spent/total_limit*100)}% used)
Monthly Income: Rs.{sess.income}
Savings Rate: {round((1 - total_spent/sess.income) * 100) if sess.income > 0 else 0}%

Give 4 specific actionable tips. Reference actual category names and amounts. Keep each tip under 2 sentences."""
    
    advice = LLMCoach.get_budget_advice(prompt)
    return {"recommendations": advice}

# ---- NEW: Peer Comparison (mock data) ----
@router.get("/peer-compare/{session_id}")
def get_peer_compare(session_id: str, db: Session = Depends(get_db)):
    """Return anonymized peer savings rate comparison for the user.
    Mock data: average savings rate per income bracket.
    """
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404)
    # Calculate user's savings rate
    total_spent = sum(sess.expenses.values()) if sess.expenses else 0
    savings_rate = (sess.income - total_spent) / sess.income if sess.income > 0 else 0
    # Mock peer data based on income brackets
    brackets = [
        (0, 20000, 0.10),
        (20001, 50000, 0.20),
        (50001, 100000, 0.30),
        (100001, 9999999, 0.40),
    ]
    peer_rate = 0.15
    for low, high, avg in brackets:
        if low <= sess.income <= high:
            peer_rate = avg
            break
    comparison = {
        "user_savings_rate": round(savings_rate * 100, 2),
        "peer_average_rate": round(peer_rate * 100, 2),
        "above_peer": savings_rate >= peer_rate,
    }
    return {"comparison": comparison}

# ---- NEW: Bad Habit Detection (nudges) ----
@router.get("/habits/{session_id}")
def get_bad_habits(session_id: str, db: Session = Depends(get_db)):
    """Detect categories that have been overspent for 3 consecutive months.
    Returns a list of nudges with category name and suggestion.
    """
    sess = db.query(models.UserSession).filter(models.UserSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404)
        
    import datetime
    transactions = db.query(models.Transaction).filter(models.Transaction.session_id == session_id).all()
    
    def get_last_6_months():
        res = []
        now = datetime.datetime.now()
        for i in range(5, -1, -1):
            m = now.month - i
            y = now.year
            if m <= 0:
                m += 12
                y -= 1
            dt = datetime.datetime(y, m, 1)
            res.append(dt.strftime("%b %Y"))
        return res
        
    months_keys = get_last_6_months()
    # Build a dict: category -> list of spent amounts per month mapping to these 6 months
    
    cat_month_spend = {cat: {m: 0 for m in months_keys} for cat in sess.expenses.keys()} if sess.expenses else {}
    
    for t in transactions:
        try:
            dt = datetime.datetime.strptime(t.date, "%d %b %Y")
            m_label_full = dt.strftime("%b %Y")
            
            if t.amount < 0 and m_label_full in months_keys:
                cat = t.category
                if cat not in cat_month_spend:
                    cat_month_spend[cat] = {m: 0 for m in months_keys}
                cat_month_spend[cat][m_label_full] += abs(t.amount)
        except Exception:
            pass

    budgets = db.query(models.Budget).filter(models.Budget.session_id == session_id).all()
    limit_map = {b.category: b.limit for b in budgets}
    nudges = []
    
    for cat, month_dict in cat_month_spend.items():
        limit = limit_map.get(cat)
        if not limit or limit <= 0:
            continue
        consecutive = 0
        for m_key in months_keys:
            if month_dict.get(m_key, 0) > limit:
                consecutive += 1
                if consecutive >= 3:
                    nudges.append({
                        "category": cat,
                        "message": f"You have overspent on {cat} for {consecutive} months. Consider setting a stricter limit or cutting back."
                    })
                    break
            else:
                consecutive = 0
                
    # Provide a default nudge if history is too new
    if not nudges and len(transactions) < 5:
        nudges.append({
            "category": "General", 
            "message": "Keep adding your daily transactions! We'll track your patterns here to catch bad habits early."
        })
        
    return {"nudges": nudges}
