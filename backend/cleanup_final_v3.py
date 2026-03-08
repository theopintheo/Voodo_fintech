import sqlite3, json

def clean_db_final_v3():
    conn = sqlite3.connect('finance-coach-ai/backend/finance_coach.db')
    cursor = conn.cursor()
    
    # 1. Reset all session data to something reasonable
    income = 60000.0
    expenses = {
        "Rent": 15000.0,
        "Food": 8000.0,
        "Transport": 5000.0,
        "Utilities": 3000.0,
        "Entertainment": 4000.0,
        "Shopping": 5000.0,
        "EMI Payment": 5000.0,
        "Misc": 5000.0
    }
    expenses_json = json.dumps(expenses)
    
    cursor.execute('UPDATE user_sessions SET income = ?, expenses = ?, health_score = 92.0, grade = "A", onboarded = 1', 
                   (income, expenses_json))
    
    # 2. Reset accounts
    cursor.execute('UPDATE accounts SET balance = 52500.0')
    
    conn.commit()
    conn.close()
    print("DB cleanup v3 (TOTAL RESET) complete.")

if __name__ == "__main__":
    clean_db_final_v3()
