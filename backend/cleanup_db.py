import sqlite3, json

def clean_db():
    conn = sqlite3.connect('finance-coach-ai/backend/finance_coach.db')
    cursor = conn.cursor()
    
    # 1. Update expenses strings to floats in user_sessions
    cursor.execute('SELECT id, expenses, income FROM user_sessions')
    rows = cursor.fetchall()
    for rid, exps_str, income in rows:
        try:
            exps = json.loads(exps_str)
            new_exps = {}
            for k, v in exps.items():
                try:
                    new_exps[k] = float(v)
                except:
                    new_exps[k] = 0.0
            
            # Clean income too
            try:
                income = float(income)
                if income > 1000000: income = 50000.0
            except:
                income = 50000.0
                
            cursor.execute('UPDATE user_sessions SET expenses = ?, income = ? WHERE id = ?', 
                           (json.dumps(new_exps), income, rid))
        except:
            pass
            
    # 2. Reset astronomical account balances
    cursor.execute('UPDATE accounts SET balance = 50000.0 WHERE balance > 1000000')
    
    # 3. Create some sample transactions for the current month (Mar 2026)
    # This will make the "Weekly" view look "proper"
    cursor.execute('SELECT session_id FROM user_sessions WHERE onboarded = 1')
    sessions = cursor.fetchall()
    for (sid,) in sessions:
        # Delete existing Mar transactions to avoid duplicates
        cursor.execute("DELETE FROM transactions WHERE session_id = ? AND date LIKE '% Mar 2026'", (sid,))
        
        txs = [
            ("Salary Credit", "Income", 50000.0, "01 Mar 2026", "Completed", "CreditCard"),
            ("Monthly Rent", "Housing", 12000.0, "02 Mar 2026", "Completed", "Home"),
            ("Grocery Store", "Food", 3500.0, "04 Mar 2026", "Completed", "Utensils"),
            ("Petrol Station", "Transport", 1200.0, "06 Mar 2026", "Completed", "Car"),
            ("Internet Bill", "Utilities", 999.0, "08 Mar 2026", "Completed", "Zap"),
            ("Movie Night", "Entertainment", 800.0, "10 Mar 2026", "Completed", "Film"),
            ("Clothing Store", "Shopping", 4500.0, "15 Mar 2026", "Completed", "ShoppingBag"),
            ("EMI Payment", "Debt/EMI", 5000.0, "20 Mar 2026", "Completed", "Building2"),
            ("Dining Out", "Food", 2200.0, "25 Mar 2026", "Completed", "Utensils"),
        ]
        for name, cat, amt, date, status, icon in txs:
            cursor.execute('''INSERT INTO transactions (session_id, name, category, amount, date, status, icon) 
                              VALUES (?, ?, ?, ?, ?, ?, ?)''', (sid, name, cat, amt, date, status, icon))

    conn.commit()
    conn.close()
    print("DB cleanup and mock data generation complete.")

if __name__ == "__main__":
    clean_db()
