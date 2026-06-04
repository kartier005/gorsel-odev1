from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import mysql.connector
import json
import time
import os

app = FastAPI(title="Office Web Uygulaması API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "db"),
    "user": os.getenv("MYSQL_USER", "officeuser"),
    "password": os.getenv("MYSQL_PASSWORD", "officepass123"),
    "database": os.getenv("MYSQL_DATABASE", "officedb"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
}


def get_db():
    """Get MySQL connection with retry logic for Docker startup."""
    for attempt in range(30):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            return conn
        except mysql.connector.Error:
            if attempt < 29:
                time.sleep(2)
            else:
                raise


def init_db():
    """Create the documents table if it doesn't exist."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            data JSON NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    conn.commit()
    cursor.close()
    conn.close()


@app.on_event("startup")
def startup():
    init_db()




class DocumentSave(BaseModel):
    data: dict  


class DocumentUpdate(BaseModel):
    data: dict



@app.get("/")
def root():
    return {"message": "Office Web Uygulaması API", "version": "1.0.0"}


@app.post("/api/documents", status_code=201)
def save_document(doc: DocumentSave):
    """Kaydet butonu - editördeki tüm veriyi JSON olarak MySQL'e kaydet."""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    json_data = json.dumps(doc.data, ensure_ascii=False)

    cursor.execute(
        "INSERT INTO documents (datetime, data) VALUES (%s, %s)",
        (now, json_data)
    )
    conn.commit()
    doc_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {
        "message": "Belge başarıyla kaydedildi!",
        "id": doc_id,
        "datetime": now,
    }


@app.get("/api/documents")
def list_documents():
    """Kaydedilmiş tüm belgeleri listele."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, datetime, data FROM documents ORDER BY datetime DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    for row in rows:
        if isinstance(row["datetime"], datetime):
            row["datetime"] = row["datetime"].isoformat()
        if isinstance(row["data"], str):
            row["data"] = json.loads(row["data"])

    return {"documents": rows, "total": len(rows)}


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: int):
    """Belirli bir belgeyi getir."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, datetime, data FROM documents WHERE id = %s", (doc_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")

    if isinstance(row["datetime"], datetime):
        row["datetime"] = row["datetime"].isoformat()
    if isinstance(row["data"], str):
        row["data"] = json.loads(row["data"])

    return row


@app.put("/api/documents/{doc_id}")
def update_document(doc_id: int, doc: DocumentUpdate):
    """Mevcut belgeyi güncelle."""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    json_data = json.dumps(doc.data, ensure_ascii=False)

    cursor.execute(
        "UPDATE documents SET datetime = %s, data = %s WHERE id = %s",
        (now, json_data, doc_id)
    )
    conn.commit()

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Belge bulunamadı")

    cursor.close()
    conn.close()

    return {"message": "Belge güncellendi!", "id": doc_id, "datetime": now}


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int):
    """Belgeyi sil."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
    conn.commit()

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Belge bulunamadı")

    cursor.close()
    conn.close()

    return {"message": "Belge silindi!", "id": doc_id}
