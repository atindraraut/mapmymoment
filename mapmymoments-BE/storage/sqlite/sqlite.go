package sqlite

import (
	"database/sql"
	"log/slog"
	_ "github.com/mattn/go-sqlite3"
	"github.com/atindraraut/crudgo/internal/config"
	"github.com/atindraraut/crudgo/internal/types"
	"fmt"
)


type Sqlite struct {
	Db *sql.DB
}

func New(cfg *config.Config) (*Sqlite, error) {
	slog.Info("Connecting to database...", slog.String("path", cfg.Storagepath))
	db,err:=sql.Open("sqlite3", cfg.Storagepath)
	if err != nil {
		return nil, err	
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS students (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		age INTEGER NOT NULL,
		email TEXT NOT NULL UNIQUE
	)`)
	if err != nil {
		return nil, err
	}
	return &Sqlite{Db: db}, nil
}

func (s *Sqlite) CreateStudent(name string, age int, email string) (int64, error) {
	stmt, err := s.Db.Prepare("INSERT INTO students (name, age, email) VALUES (?, ?, ?)")
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	res, err := stmt.Exec(name, age, email)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (s *Sqlite) GetStudentById(id int64) (types.Student, error) {
	var student types.Student
	stmt, err := s.Db.Prepare("SELECT id, name, age, email FROM students WHERE id = ?")
	if err != nil {
		return student, err
	}
	defer stmt.Close()
	err = stmt.QueryRow(id).Scan(&student.Id, &student.Name, &student.Age, &student.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return student, fmt.Errorf("student with id %d not found", id)
		}
		return student, err
	}
	defer stmt.Close()
	return student, nil
}

func (s *Sqlite) GetAllStudents() ([]types.Student, error) {
	var students []types.Student
	rows, err := s.Db.Query("SELECT id, name, age, email FROM students")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var student types.Student
		err = rows.Scan(&student.Id, &student.Name, &student.Age, &student.Email)
		if err != nil {
			return nil, err
		}
		students = append(students, student)
	}
	defer rows.Close()
	return students, nil
}

func (s *Sqlite) UpdateStudent(id int64, name string, age int, email string) (int64, error) {
	stmt, err := s.Db.Prepare("UPDATE students SET name = ?, age = ?, email = ? WHERE id = ?")
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	res, err := stmt.Exec(name, age, email, id)
	if err != nil {
		return 0, err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return 0, err
	}
	return rowsAffected, nil
}

func (s *Sqlite) DeleteStudent(id int64) (int64, error) {
	stmt, err := s.Db.Prepare("DELETE FROM students WHERE id = ?")
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	res, err := stmt.Exec(id)
	if err != nil {
		return 0, err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return 0, err
	}
	return rowsAffected, nil
}