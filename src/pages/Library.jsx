import React, { useState, useEffect } from "react";
import {
  Search,
  Library as LibraryIcon,
  BookOpen,
  Plus,
  Calendar,
  User,
  RotateCcw,
  BookMarked,
  ClipboardList,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { getUser } from "../lib/auth";
import { cn } from "../lib/utils";
import { toast } from "../lib/toast";

const todayStr = () => new Date().toISOString().slice(0, 10);

const CSV_TEMPLATE = `book_id,title,author,category,total_copies,shelf
,Sample Book Title,Author Name,Science,5,A-01
,Another Book,Jane Doe,Literature,3,B-02`;

const parseCsvToBooks = (text) => {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const idx = (name) => header.indexOf(name);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.every((c) => !c)) continue;
    const get = (key, alt) => {
      const j = idx(key);
      if (j >= 0 && cols[j] !== undefined) return cols[j];
      if (alt) {
        const k = idx(alt);
        if (k >= 0) return cols[k];
      }
      return "";
    };
    rows.push({
      book_id: get("book_id", "id"),
      title: get("title"),
      author: get("author"),
      category: get("category") || "General",
      total_copies: get("total_copies", "copies") || "1",
      shelf: get("shelf"),
    });
  }
  return rows;
};

const LibraryPage = () => {
  const user = getUser();
  const role = user?.role || "Student";
  const isLibrarian = role === "Librarian" || role === "Admin";
  const isStudent = role === "Student";

  const [tab, setTab] = useState(isStudent ? "my-books" : isLibrarian ? "add-book" : "catalog");
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [issueForm, setIssueForm] = useState({
    book: "",
    student: "",
    borrowed_date: todayStr(),
    due_date: "",
    notes: "",
  });
  const [bookForm, setBookForm] = useState({
    book_id: "",
    title: "",
    author: "",
    category: "General",
    total_copies: "1",
    shelf: "",
  });
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkResult, setBulkResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const bookList = await api.getBooks([]);
      setBooks(bookList);

      if (isLibrarian) {
        const studentList = await api.getStudents([]);
        setStudents(studentList);
        const allLoans = await api.getBookLoans({ role: "Librarian" }, []);
        setLoans(allLoans);
      } else if (isStudent) {
        const myLoans = await api.getBookLoans({
          role: "Student",
          studentEmail: user?.email,
        }, []);
        setLoans(myLoans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user?.email]);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.book || !issueForm.student || !issueForm.borrowed_date || !issueForm.due_date) {
      toast.error("Please fill book, student, borrowed date, and due date.");
      return;
    }
    setSubmitting(true);
    try {
      await api.issueBookLoan({
        book: issueForm.book,
        student: issueForm.student,
        borrowed_date: issueForm.borrowed_date,
        due_date: issueForm.due_date,
        notes: issueForm.notes,
        issued_by: user?.name || "Librarian",
        requester_role: role,
        requester_name: user?.name,
      });
      setIssueForm({
        book: "",
        student: "",
        borrowed_date: todayStr(),
        due_date: "",
        notes: "",
      });
      await loadData();
      setTab("loans");
      toast.success("Book issued successfully!");
    } catch (err) {
      toast.error("Failed to issue book: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      toast.error("Title and author are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.addBook({
        book_id: bookForm.book_id.trim() || undefined,
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        category: bookForm.category.trim() || "General",
        total_copies: parseInt(bookForm.total_copies, 10) || 1,
        shelf: bookForm.shelf.trim() || null,
        requester_role: role,
      });
      setBookForm({
        book_id: "",
        title: "",
        author: "",
        category: "General",
        total_copies: "1",
        shelf: "",
      });
      await loadData();
      setTab("catalog");
      toast.success("Book added to catalog.");
    } catch (err) {
      toast.error("Failed to add book: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const rows = parseCsvToBooks(bulkCsv);
    if (rows.length === 0) {
      toast.error("Paste CSV data or upload a file. Need a header row and at least one book row.");
      return;
    }
    setSubmitting(true);
    setBulkResult(null);
    try {
      const res = await api.bulkUploadBooks(rows, role);
      setBulkResult(res);
      if (res.created_count > 0) await loadData();
      toast.success(res.message || `Added ${res.created_count} book(s).`);
    } catch (err) {
      toast.error("Bulk upload failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkCsv(String(reader.result || ""));
    reader.readAsText(file);
  };

  const handleReturn = async (loanId) => {
    if (!confirm("Mark this book as returned?")) return;
    try {
      await api.returnBookLoan(loanId, {
        returned_date: todayStr(),
        requester_role: role,
      });
      await loadData();
      toast.success("Book marked as returned.");
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()) ||
      (b.book_id || b.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeLoans = loans.filter((l) => l.status === "Borrowed" || l.status === "Overdue");
  const myLoansDisplay = isStudent ? loans : activeLoans;

  const tabs = isLibrarian
    ? [
        { id: "add-book", label: "Add Book", icon: Plus },
        { id: "bulk-upload", label: "Bulk Upload", icon: Upload },
        { id: "issue", label: "Issue Book", icon: ClipboardList },
        { id: "loans", label: "Active Loans", icon: BookMarked },
        { id: "catalog", label: "Catalog", icon: BookOpen },
      ]
    : isStudent
    ? [
        { id: "my-books", label: "My Borrowed Books", icon: BookMarked },
        { id: "catalog", label: "Browse Catalog", icon: BookOpen },
      ]
    : [{ id: "catalog", label: "Catalog", icon: BookOpen }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LibraryIcon className="text-primary" />
          {isStudent ? "My Library" : isLibrarian ? "Library Management" : "Library Catalog"}
        </h1>
        <p className="text-muted-foreground">
          {isLibrarian
            ? "Add books, bulk upload catalog, issue loans, and manage returns."
            : isStudent
            ? "View books you have borrowed and browse the catalog."
            : "Browse the school library catalog."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-secondary/50 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "add-book" && isLibrarian && (
        <Card className="border-primary/20 max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={18} className="text-primary" /> Add new book
            </CardTitle>
            <CardDescription>Register a single title in the library catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Book ID (optional)</label>
                <input
                  type="text"
                  value={bookForm.book_id}
                  onChange={(e) => setBookForm({ ...bookForm, book_id: e.target.value })}
                  placeholder="Auto-generated e.g. BK007 if empty"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Title *</label>
                <input
                  type="text"
                  required
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Author *</label>
                <input
                  type="text"
                  required
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
                  <select
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                  >
                    {["General", "Science", "Literature", "History", "Reference", "Mathematics", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Total copies</label>
                  <input
                    type="number"
                    min={1}
                    value={bookForm.total_copies}
                    onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Shelf location</label>
                <input
                  type="text"
                  value={bookForm.shelf}
                  onChange={(e) => setBookForm({ ...bookForm, shelf: e.target.value })}
                  placeholder="e.g. A-12"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Plus size={16} />
                {submitting ? "Saving..." : "Add to catalog"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "bulk-upload" && isLibrarian && (
        <div className="space-y-4 max-w-3xl">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={18} className="text-primary" /> Bulk book upload
              </CardTitle>
              <CardDescription>
                Upload a CSV file or paste rows. Columns: book_id (optional), title, author, category, total_copies, shelf
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => handleCsvFile(e.target.files?.[0])}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary/50">
                    <FileSpreadsheet size={16} /> Choose CSV file
                  </span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkCsv(CSV_TEMPLATE)}
                >
                  Load sample template
                </Button>
              </div>
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <textarea
                  value={bulkCsv}
                  onChange={(e) => setBulkCsv(e.target.value)}
                  rows={12}
                  placeholder={CSV_TEMPLATE}
                  className="w-full font-mono text-xs border border-border rounded-xl p-3 bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  {parseCsvToBooks(bulkCsv).length} book row(s) ready to import
                </p>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  <Upload size={16} />
                  {submitting ? "Uploading..." : "Import books"}
                </Button>
              </form>
              {bulkResult && (
                <div className="text-sm rounded-xl bg-secondary/30 p-3 space-y-1">
                  <p className="font-medium text-emerald-600">
                    Added {bulkResult.created_count} book(s)
                  </p>
                  {bulkResult.error_count > 0 && (
                    <p className="text-orange-600">{bulkResult.error_count} row(s) skipped</p>
                  )}
                  {bulkResult.errors?.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc pl-4">
                      {bulkResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>Row {err.row}: {err.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "issue" && isLibrarian && (
        <Card className="border-primary/20 max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={18} className="text-primary" /> Issue book to student
            </CardTitle>
            <CardDescription>Record who borrowed the book and the dates</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Book</label>
                <select
                  required
                  value={issueForm.book}
                  onChange={(e) => setIssueForm({ ...issueForm, book: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select book...</option>
                  {books
                    .filter((b) => (b.available_copies ?? b.available ?? 0) > 0)
                    .map((b) => (
                      <option key={b.book_id || b.id} value={b.book_id || b.id}>
                        {b.title} — {b.available_copies ?? b.available} available
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Student</label>
                <select
                  required
                  value={issueForm.student}
                  onChange={(e) => setIssueForm({ ...issueForm, student: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.name} ({s.student_id}) — {s.grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} /> Borrowed date
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.borrowed_date}
                    onChange={(e) => setIssueForm({ ...issueForm, borrowed_date: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} /> Due date
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.due_date}
                    onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Notes (optional)</label>
                <input
                  type="text"
                  value={issueForm.notes}
                  onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                  placeholder="e.g. 2-week loan"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Plus size={16} />
                {submitting ? "Saving..." : "Save loan record"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(tab === "loans" || tab === "my-books") && (
        <div className="space-y-4">
          {isStudent && (
            <p className="text-sm text-muted-foreground">
              Books currently issued to you (login: {user?.email})
            </p>
          )}
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : myLoansDisplay.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {isStudent ? "You have no borrowed books right now." : "No active loans."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myLoansDisplay.map((loan) => (
                <Card key={loan.id}>
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="text-primary" size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold">{loan.book_title || loan.book}</h3>
                        <p className="text-sm text-muted-foreground">{loan.book_author || ""}</p>
                        {isLibrarian && (
                          <p className="text-sm mt-1 flex items-center gap-1">
                            <User size={14} />
                            {loan.student_name} ({loan.student_id || loan.student}) — {loan.student_grade}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Borrowed: {loan.borrowed_date}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            Due: {loan.due_date}
                          </span>
                          {loan.returned_date && (
                            <span>Returned: {loan.returned_date}</span>
                          )}
                        </div>
                        {loan.issued_by && isLibrarian && (
                          <p className="text-[10px] text-muted-foreground mt-1">Issued by {loan.issued_by}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                          loan.status === "Overdue"
                            ? "bg-red-500/10 text-red-500"
                            : loan.status === "Returned"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-blue-500/10 text-blue-500"
                        )}
                      >
                        {loan.status}
                      </span>
                      {isLibrarian && loan.status !== "Returned" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleReturn(loan.id)}
                        >
                          <RotateCcw size={14} /> Return
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "catalog" && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.book_id || book.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start gap-2">
                    <BookOpen size={18} className="text-primary shrink-0" />
                    {book.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <div className="flex justify-between mt-3 text-xs">
                    <span className="px-2 py-1 rounded-full bg-secondary">{book.category}</span>
                    <span className="font-bold text-primary">
                      {book.available_copies ?? book.available ?? 0} available
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LibraryPage;
