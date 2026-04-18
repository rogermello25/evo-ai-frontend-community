"""
┌──────────────────────────────────────────────────────────────────────────────┐
│ @author: Davidson Gomes                                                      │
│ @file: database.py                                                           │
│ Developed by: Davidson Gomes                                                 │
│ Creation date: May 13, 2025                                                  │
│ Contact: contato@evolution-api.com                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ @copyright © Evolution API 2025. All rights reserved.                        │
│ Licensed under the Apache License, Version 2.0                               │
│                                                                              │
│ You may not use this file except in compliance with the License.             │
│ You may obtain a copy of the License at                                      │
│                                                                              │
│    http://www.apache.org/licenses/LICENSE-2.0                                │
│                                                                              │
│ Unless required by applicable law or agreed to in writing, software          │
│ distributed under the License is distributed on an "AS IS" BASIS,            │
│ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
│ See the License for the specific language governing permissions and          │
│ limitations under the License.                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ @important                                                                   │
│ For any future changes to the code in this file, it is recommended to        │
│ include, together with the modification, the information of the developer    │
│ who changed it and the date of modification.                                 │
└──────────────────────────────────────────────────────────────────────────────┘
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from src.config.settings import settings

# Remove sslmode parameter from connection string - asyncpg uses 'ssl' not 'sslmode'
db_url = settings.POSTGRES_CONNECTION_STRING
# Remove sslmode entirely - asyncpg handles SSL differently
if 'sslmode=disable' in db_url:
    db_url = db_url.replace("?sslmode=disable", "").replace("&sslmode=disable", "")
elif 'sslmode=require' in db_url:
    db_url = db_url.replace("?sslmode=require", "?ssl=true").replace("&sslmode=require", "&ssl=true")
elif 'sslmode=verify-full' in db_url:
    db_url = db_url.replace("?sslmode=verify-full", "?ssl=true").replace("&sslmode=verify-full", "&ssl=true")
POSTGRES_CONNECTION_STRING = db_url

engine = create_engine(POSTGRES_CONNECTION_STRING)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
