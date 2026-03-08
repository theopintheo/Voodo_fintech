# finance-coach-ai/backend/scoring_engine.py

class FinancialHealthEngine:
    @staticmethod
    def calculate_score(income, expenses):
        """
        Calculate health score (0-100) and grade (A-F).
        expenses: dict of category -> amount
        """
        if income <= 0:
            return 0, "F"
        
        total_exp = sum(expenses.values())
        savings = income - total_exp
        savings_rate = (savings / income) * 100
        
        score = 0
        
        # Savings Rate Scoring (Max 40)
        if savings_rate >= 30:
            score += 40
        elif savings_rate >= 15:
            score += 25
        elif savings_rate > 0:
            score += 10
        
        # Essential Expenses Check (Max 30)
        # Assuming Rent, Food, Transport are essential
        essential_categories = ["Rent/Hostel", "Food", "Transport"]
        essential_exp = sum(expenses.get(cat, 0) for cat in essential_categories)
        if (essential_exp / income) <= 0.50:
            score += 30
        
        # Debt Ratio Check (Max 20)
        debt_exp = expenses.get("EMI/Loans", 0)
        if (debt_exp / income) <= 0.20:
            score += 20
        
        # Emergency Savings Habit (Max 10) - Binary for this simple impl
        score += 10 # Default for participating
        
        # Grading
        grade = "F"
        if score >= 90: grade = "A+"
        elif score >= 80: grade = "A"
        elif score >= 70: grade = "B"
        elif score >= 60: grade = "C"
        elif score >= 50: grade = "D"
        else: grade = "E"
        
        return score, grade

    @staticmethod
    def classify_personality(answers):
        """
        answers: list of 5 boolean/choice values
        """
        # Simple logic: If more trues in specific categories, classify.
        # Spender count vs Saver count
        if sum(answers) >= 4:
            return "Saver"
        elif sum(answers) <= 1:
            return "Spender"
        else:
            return "Impulsive Buyer"
