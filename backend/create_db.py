import asyncio
import asyncpg
import sys
import os

from app.core.config import get_settings

async def main():
    settings = get_settings()
    db_url = settings.DATABASE_URL
    # parse db_url (postgresql+asyncpg://user:password@host:port/dbname)
    # e.g. postgresql+asyncpg://postgres:YOUR_PG_PASSWORD@localhost:5432/invoice_decision_tool
    url_without_driver = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    # We need to connect to 'postgres' db first to create the target database
    # Split out the dbname
    base_url = url_without_driver.rsplit('/', 1)[0]
    target_db = url_without_driver.rsplit('/', 1)[1]
    
    postgres_db_url = f"{base_url}/postgres"

    try:
        # Connect to default postgres DB to create the new DB
        print(f"Connecting to default database to create {target_db}...")
        conn = await asyncpg.connect(postgres_db_url)
        
        # Check if db exists
        db_exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{target_db}'")
        if not db_exists:
            print(f"Creating database {target_db}...")
            await conn.execute(f"CREATE DATABASE {target_db}")
        else:
            print("Database already exists.")
        await conn.close()

        # Connect to the new DB and run init.sql
        print(f"Connecting to {target_db} and running init.sql...")
        conn2 = await asyncpg.connect(url_without_driver)
        with open("../database/init.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        await conn2.execute(sql)
        await conn2.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
