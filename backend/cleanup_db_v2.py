import sqlite3, json

def clean_db_v2():
    conn = sqlite3.connect('finance-coach-ai/backend/finance_coach.db')
    cursor = conn.cursor()
    
    # 1. Update expenses strings to floats in user_sessions and BOUND them
    cursor.execute('SELECT id, expenses, income FROM user_sessions')
    rows = cursor.fetchall()
    for rid, exps_str, income in rows:
        try:
            exps = json.loads(exps_str)
            new_exps = {}
            for k, v in exps.items():
                try:
                    val = float(v)
                    # Bound to reasonable limits if astronomical
                    if val > 1000000: val = 10000.0 
                    new_exps[k] = val
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
            
    # 2. Reset account balances
    cursor.execute('UPDATE accounts SET balance = 52500.0 WHERE balance > 1000000')
    
    conn.commit()
    conn.close()
    print("DB cleanup v2 complete.")

if __name__ == "__main__":
    clean_db_v2()
