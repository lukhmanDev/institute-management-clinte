import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Send,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { toast } from "../lib/toast";
import { getUser } from "../lib/auth";

const mockStudentFees = [
  { id: 1, student: "STU001", student_name: "Alice Johnson", student_grade: "10-A", total: 1200, paid: 1200, pending: 0, status: "Paid", due_date: "Paid" },
  { id: 2, student: "STU002", student_name: "Bob Smith", student_grade: "9-B", total: 1000, paid: 600, pending: 400, status: "Partial", due_date: "May 15, 2026" },
  { id: 3, student: "STU003", student_name: "Charlie Brown", student_grade: "12-C", total: 1500, paid: 0, pending: 1500, status: "Unpaid", due_date: "May 20, 2026" },
  { id: 4, student: "STU004", student_name: "Diana Prince", student_grade: "11-A", total: 1300, paid: 1300, pending: 0, status: "Paid", due_date: "Paid" },
];

const feeData = [
  { month: "Jan", amount: 45000 },
  { month: "Feb", amount: 52000 },
  { month: "Mar", amount: 48000 },
  { month: "Apr", amount: 61000 },
  { month: "May", amount: 55000 },
  { month: "Jun", amount: 67000 },
];

const Fees = () => {
  const user = getUser();
  const isStudent = user?.role === "Student";
  const [feesList, setFeesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(null); // 'order', 'razorpay', 'verifying', 'success'

  // Admin fee creation modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState("bulk"); // 'bulk' or 'single'
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // Form states
  const [bulkClass, setBulkClass] = useState("All");
  const [bulkDesc, setBulkDesc] = useState("June 2026 Monthly Fees");
  const [bulkAmount, setBulkAmount] = useState("1200.00");
  const [bulkDueDate, setBulkDueDate] = useState("June 30, 2026");

  const [singleStudent, setSingleStudent] = useState("");
  const [singleDesc, setSingleDesc] = useState("June 2026 Tuition Fee");
  const [singleAmount, setSingleAmount] = useState("1200.00");
  const [singleDueDate, setSingleDueDate] = useState("June 30, 2026");

  const fetchFees = async () => {
    setLoading(true);
    const data = await api.getFees(mockStudentFees);
    setFeesList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFees();
    if (!isStudent) {
      api.getClasses([]).then(setClasses);
      api.getStudents([]).then(setStudents);
    }
  }, []);

  const handleCreateFees = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (createTab === "bulk") {
        const res = await api.bulkGenerateFees({
          classroom_id: bulkClass,
          description: bulkDesc,
          amount: parseFloat(bulkAmount) || 0,
          due_date: bulkDueDate
        });
        if (res.success || res.created_count > 0) {
          toast.success(res.message || "Monthly statements generated successfully!");
          setShowCreateModal(false);
          fetchFees();
        } else {
          toast.error("Failed to generate monthly fees.");
        }
      } else {
        if (!singleStudent) {
          toast.error("Please select a student.");
          setSubmitting(false);
          return;
        }
        
        const studentObj = students.find(s => s.student_id === singleStudent || s.id.toString() === singleStudent.toString());
        if (!studentObj) {
          toast.error("Invalid student selected.");
          setSubmitting(false);
          return;
        }

        const amt = parseFloat(singleAmount) || 0;
        const res = await api.addFeeRecord({
          student: studentObj.id,
          total: amt,
          paid: 0.00,
          pending: amt,
          status: "Unpaid",
          due_date: singleDueDate
        });
        if (res) {
          toast.success("Student fee statement generated successfully!");
          setShowCreateModal(false);
          fetchFees();
        } else {
          toast.error("Failed to generate student fee statement.");
        }
      }
    } catch (err) {
      toast.error("Error creating fee statement: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayFee = async (record) => {
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      toast.error("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    setPaying(true);
    setPaymentStep('order');
    try {
      const orderRes = await api.createFeeOrder(record.id);
      if (!orderRes.success) {
        throw new Error(orderRes.message || "Failed to initiate transaction.");
      }

      setPaymentStep('razorpay');

      const options = {
        key: orderRes.key_id,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "EduHub Institution Management",
        description: `Academic Fee Payment - ${record.studentId}`,
        order_id: orderRes.order_id,
        handler: async function (response) {
          try {
            setPaymentStep('verifying');
            const verifyRes = await api.verifyFeePayment({
              fee_record_id: record.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.success) {
              setPaymentStep('success');
              toast.success(verifyRes.message || "Fee paid successfully!");
              setTimeout(() => {
                setPaymentStep(null);
                fetchFees();
              }, 2000);
            } else {
              setPaymentStep(null);
              toast.error(verifyRes.message || "Payment verification failed.");
            }
          } catch (err) {
            setPaymentStep(null);
            toast.error("Payment verification failed: " + err.message);
          }
        },
        prefill: {
          name: record.name,
          email: user?.email || "student@eduhub.com",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function() {
            setPaymentStep(null);
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentStep(null);
      toast.error("Payment initiation failed: " + err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleSendReminder = async (id) => {
    try {
      const response = await api.sendFeeReminder(id);
      toast.success(response.message || "Reminder sent successfully!");
    } catch (err) {
      toast.error("Failed to send reminder: " + err.message);
    }
  };

  const mapFee = (f) => ({
    id: f.id,
    studentId: f.student && typeof f.student === "object" ? f.student.student_id : (f.student || "STU001"),
    name: f.student_name || (f.student && typeof f.student === "object" ? f.student.name : "Student"),
    class: f.student_grade || (f.student && typeof f.student === "object" ? f.student.grade : "10-A"),
    total: parseFloat(f.total) || 0,
    paid: parseFloat(f.paid) || 0,
    pending: parseFloat(f.pending) || 0,
    status: f.status || "Unpaid",
    dueDate: f.due_date || "Paid"
  });

  const totalCollected = feesList.reduce((sum, f) => sum + (parseFloat(f.paid) || 0), 0);
  const totalPending = feesList.reduce((sum, f) => sum + (parseFloat(f.pending) || 0), 0);
  const overdueCount = feesList.filter(f => f.status === 'Unpaid').length;
  const totalOverdueAmount = feesList.reduce((sum, f) => sum + (f.status === 'Unpaid' ? (parseFloat(f.pending) || 0) : 0), 0);

  const dynamicStats = [
    { label: "Total Collected", value: `$${totalCollected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: "+12.5%", trend: "up", icon: DollarSign, color: "emerald" },
    { label: "Pending Fees", value: `$${totalPending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: "+2.1%", trend: "up", icon: Clock, color: "orange" },
    { label: "Scholarships", value: "$24,000.00", change: "-1.5%", trend: "down", icon: CreditCard, color: "blue" },
    { label: "Overdue", value: `$${totalOverdueAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: `from ${overdueCount} accounts`, trend: "up", icon: AlertCircle, color: "red" },
  ];

  const filteredFees = feesList.map(mapFee).filter(fee => {
    const term = searchTerm.toLowerCase();
    return fee.name.toLowerCase().includes(term) ||
           fee.studentId.toLowerCase().includes(term) ||
           fee.class.toLowerCase().includes(term) ||
           fee.status.toLowerCase().includes(term);
  });

  // STUDENT VIEW IMPLEMENTATION
  if (isStudent) {
    const studentFee = filteredFees[0] || mapFee(mockStudentFees.find(f => f.student_name === user?.name) || mockStudentFees[0]);
    const tuitionCost = studentFee.total * 0.75;
    const labCost = studentFee.total * 0.15;
    const associationCost = studentFee.total * 0.10;

    return (
      <div className="space-y-6">
        {/* Print specific CSS stylesheet injection */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible !important;
            }
            #printable-receipt {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* Dynamic Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              My Fees & Accounts
            </h1>
            <p className="text-muted-foreground mt-1">Hello, {studentFee.name}. View your secure academic statements and make fast digital payments.</p>
          </div>
          {studentFee.status === "Paid" && (
            <Button 
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md transform hover:-translate-y-0.5 transition-all"
              onClick={() => setShowReceiptModal(true)}
            >
              <Download size={16} />
              <span>View Official Receipt</span>
            </Button>
          )}
        </div>

        {/* Student Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden border-indigo-500/10 bg-indigo-500/5 group hover:border-indigo-500/25 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Total Billed Fees</span>
                <DollarSign size={18} className="text-indigo-500" />
              </div>
              <h3 className="text-3xl font-black mt-2 tracking-tight">${studentFee.total.toFixed(2)}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Full registration for current semester</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-emerald-500/10 bg-emerald-500/5 group hover:border-emerald-500/25 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Cleared</span>
                <CreditCard size={18} className="text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black mt-2 tracking-tight">${studentFee.paid.toFixed(2)}</h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Credited to school bank portal</p>
            </CardContent>
          </Card>

          <Card className={cn(
            "relative overflow-hidden transition-all",
            studentFee.pending > 0 
              ? "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 animate-pulse-subtle" 
              : "border-teal-500/10 bg-teal-500/5 hover:border-teal-500/20"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Net Dues Outstanding</span>
                <Clock size={18} className={studentFee.pending > 0 ? "text-amber-500" : "text-teal-500"} />
              </div>
              <h3 className="text-3xl font-black mt-2 tracking-tight">${studentFee.pending.toFixed(2)}</h3>
              <p className="text-[10px] mt-1 font-semibold">
                {studentFee.pending > 0 ? `Due date: ${studentFee.dueDate}` : "Account fully paid"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice & Status Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Card */}
          <Card className="lg:col-span-2 overflow-hidden border border-secondary/40 shadow-xl bg-card">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader className="border-b bg-secondary/10 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight">Academic Invoice Statement</CardTitle>
                  <CardDescription>Statement ID: INV-2026-FEE-{studentFee.id.toString().padStart(4, '0')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    studentFee.status === 'Paid' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                    studentFee.status === 'Partial' ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                    "bg-red-500/10 text-red-600 border border-red-500/20"
                  )}>
                    {studentFee.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Student Metadata Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/20 text-xs">
                <div>
                  <span className="text-muted-foreground block uppercase font-semibold text-[9px] tracking-wider">Student Name</span>
                  <span className="font-semibold text-card-foreground">{studentFee.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase font-semibold text-[9px] tracking-wider">Student ID</span>
                  <span className="font-mono font-semibold text-card-foreground">{studentFee.studentId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase font-semibold text-[9px] tracking-wider">Grade/Classroom</span>
                  <span className="font-semibold text-card-foreground">{studentFee.class}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase font-semibold text-[9px] tracking-wider">Statement Date</span>
                  <span className="font-semibold text-card-foreground">May 25, 2026</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Charge Description</h4>
                <div className="divide-y divide-border border rounded-xl overflow-hidden bg-secondary/5">
                  <div className="flex justify-between p-4 text-sm">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-card-foreground">Tuition & Academic Program Fee</p>
                      <p className="text-[10px] text-muted-foreground">Lectures, examinations, course materials, and administrative registration charges</p>
                    </div>
                    <span className="font-mono font-semibold text-card-foreground">${tuitionCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-4 text-sm">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-card-foreground">Lab, Library & Technological Facilities</p>
                      <p className="text-[10px] text-muted-foreground">High-speed terminal networks, scientific laboratory research equipment, and subscription journals</p>
                    </div>
                    <span className="font-mono font-semibold text-card-foreground">${labCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-4 text-sm">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-card-foreground">Student Association & Welfare Fund</p>
                      <p className="text-[10px] text-muted-foreground">Club sponsorship support, campus activity scheduling, medical coverage plans, and union events</p>
                    </div>
                    <span className="font-mono font-semibold text-card-foreground">${associationCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Balance Sheet */}
              <div className="flex flex-col items-end gap-2 text-sm pt-4 border-t border-dashed">
                <div className="flex justify-between w-64 text-muted-foreground">
                  <span>Gross Billed:</span>
                  <span className="font-mono">${studentFee.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-emerald-600 font-medium">
                  <span>Credited Payments:</span>
                  <span className="font-mono">-${studentFee.paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 font-black text-lg text-card-foreground pt-2 border-t">
                  <span>Net Due Outstanding:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">${studentFee.pending.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secure Payment Side-panel */}
          <div className="space-y-6">
            <Card className="border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.03] to-purple-500/[0.03] shadow-lg overflow-hidden relative">
              <div className="p-6 space-y-6 flex flex-col justify-between h-full">
                <div>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 w-fit mb-4">
                    <CreditCard size={24} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Secure Payment Portal</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete your school fee payment using Razorpay's premium PCI-DSS certified gateway dashboard. Supports credit cards, net banking, UPI, and wallets.
                  </p>
                </div>

                <div className="space-y-4 pt-6">
                  {studentFee.pending > 0 ? (
                    <>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 leading-normal">
                          You have a pending balance of <strong>${studentFee.pending.toFixed(2)}</strong>. Please clear outstanding amounts before the due date ({studentFee.dueDate}) to avoid late service penalties.
                        </div>
                      </div>

                      <Button 
                        disabled={paying || paymentStep !== null}
                        onClick={() => handlePayFee(studentFee)}
                        className="w-full py-6 font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                      >
                        {paying ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CreditCard size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        )}
                        <span>Proceed to Secure Checkout</span>
                      </Button>
                    </>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center text-center gap-3 py-8">
                      <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Statement Cleared</h4>
                        <p className="text-[10px] text-muted-foreground max-w-[200px]">Thank you! Your academic invoice has been paid in full and cryptographically verified.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground mt-4">
                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Razorpay SSL SECURED CHECKOUT</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Live Progress Tracker during Transaction */}
            {paymentStep !== null && (
              <Card className="border border-indigo-500/30 bg-indigo-500/[0.02] p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Transaction Status Tracker</h4>
                <div className="space-y-3.5 relative pl-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-950">
                  <div className="flex items-start gap-3 relative">
                    <div className={cn(
                      "w-3 h-3 rounded-full absolute -left-[15px] top-1 border border-card flex items-center justify-center",
                      paymentStep === 'order' ? "bg-indigo-600 animate-ping" : "bg-indigo-600"
                    )} />
                    <div className="text-[11px]">
                      <p className={cn("font-bold", paymentStep === 'order' ? "text-indigo-600" : "text-card-foreground")}>Creating secure Razorpay order token</p>
                      <p className="text-[9px] text-muted-foreground">Request sent to academic treasury backend</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative">
                    <div className={cn(
                      "w-3 h-3 rounded-full absolute -left-[15px] top-1 border border-card",
                      paymentStep === 'razorpay' ? "bg-indigo-600 animate-ping" : 
                      paymentStep === 'order' ? "bg-secondary" : "bg-indigo-600"
                    )} />
                    <div className="text-[11px]">
                      <p className={cn("font-bold", paymentStep === 'razorpay' ? "text-indigo-600 animate-pulse" : paymentStep === 'order' ? "text-muted-foreground" : "text-card-foreground")}>Awaiting customer payment approval</p>
                      <p className="text-[9px] text-muted-foreground">Standard Sandbox Checkout Overlay is active</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative">
                    <div className={cn(
                      "w-3 h-3 rounded-full absolute -left-[15px] top-1 border border-card",
                      paymentStep === 'verifying' ? "bg-indigo-600 animate-ping" : 
                      (paymentStep === 'success' ? "bg-indigo-600" : "bg-secondary")
                    )} />
                    <div className="text-[11px]">
                      <p className={cn("font-bold", paymentStep === 'verifying' ? "text-indigo-600" : (paymentStep === 'success' ? "text-card-foreground" : "text-muted-foreground"))}>Cryptographic Signature Verification</p>
                      <p className="text-[9px] text-muted-foreground">Matching SHA256 HMAC tokens dynamically</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative">
                    <div className={cn(
                      "w-3 h-3 rounded-full absolute -left-[15px] top-1 border border-card",
                      paymentStep === 'success' ? "bg-emerald-500 animate-pulse" : "bg-secondary"
                    )} />
                    <div className="text-[11px]">
                      <p className={cn("font-bold", paymentStep === 'success' ? "text-emerald-500" : "text-muted-foreground")}>Payment completed & posted</p>
                      <p className="text-[9px] text-muted-foreground">Database updated and parents notified</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Printable Official Receipt Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in">
            <div className="bg-card w-full max-w-xl rounded-2xl border border-secondary/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Top Actions */}
              <div className="p-4 border-b bg-secondary/10 flex items-center justify-between no-print">
                <span className="text-xs font-bold text-muted-foreground">Official Payment Receipt Receipt</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-semibold" onClick={() => window.print()}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Receipt</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-muted-foreground hover:bg-secondary" onClick={() => setShowReceiptModal(false)}>
                    Close
                  </Button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="overflow-y-auto p-8" id="printable-receipt">
                <div className="space-y-6">
                  {/* School Letterhead */}
                  <div className="flex justify-between items-start border-b pb-6">
                    <div className="space-y-1">
                      <h2 className="text-lg font-black tracking-tight text-primary">EDUHUB ACADEMY</h2>
                      <p className="text-[10px] text-muted-foreground">100 Innovation Parkway, Suite 500<br />Silicon Valley, CA 94025<br />treasury@eduhub.edu</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                        Cleared & Posted
                      </span>
                      <p className="text-[9px] text-muted-foreground mt-2">Receipt ID: <strong>REC-2026-FEE-{studentFee.id}</strong></p>
                    </div>
                  </div>

                  {/* Payment Metadata details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider block">Billed To</span>
                      <span className="font-semibold block">{studentFee.name}</span>
                      <span className="text-muted-foreground font-mono">{studentFee.studentId} | Classroom {studentFee.class}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider block">Transaction Info</span>
                      <span className="font-semibold block">Cleared on May 25, 2026</span>
                      <span className="text-muted-foreground font-mono block">Secured via Razorpay API</span>
                    </div>
                  </div>

                  {/* Receipt Breakdown table */}
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-secondary/20 p-3 font-bold border-b text-muted-foreground uppercase text-[9px] tracking-wider">
                      <span>Description</span>
                      <span className="text-right">Charged Amount</span>
                      <span className="text-right">Cleared Amount</span>
                    </div>
                    <div className="divide-y divide-border">
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-medium">Tuition & Administrative Registration Fee</span>
                        <span className="text-right font-mono">${tuitionCost.toFixed(2)}</span>
                        <span className="text-right font-mono text-emerald-600">${tuitionCost.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-medium">Lab, Library & Tech Infrastructure</span>
                        <span className="text-right font-mono">${labCost.toFixed(2)}</span>
                        <span className="text-right font-mono text-emerald-600">${labCost.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="font-medium">Student Welfare & Club Association</span>
                        <span className="text-right font-mono">${associationCost.toFixed(2)}</span>
                        <span className="text-right font-mono text-emerald-600">${associationCost.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="bg-secondary/15 p-4 border-t flex justify-between items-center text-sm font-bold">
                      <span className="uppercase text-[9px] tracking-wider text-muted-foreground">Total Fees Fully Settled</span>
                      <span className="font-mono text-base text-emerald-600">${studentFee.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Official Audit Stamp watermark */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-emerald-500/30 bg-emerald-500/[0.02] rounded-xl p-4 text-center mt-6">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">VERIFIED SECURE PAYMENT</span>
                    <p className="text-[8px] text-muted-foreground max-w-[320px] mt-1 leading-normal">
                      This document is a computer-generated transaction record. Verification of security tokens is handled cryptographically via official SHA-256 school database registries. No signature is required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ADMIN/STAFF/TEACHER VIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees Management</h1>
          <p className="text-muted-foreground">Track payments, manage scholarships, and send reminders.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            <span>Export Report</span>
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>New Payment</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "p-2 rounded-lg bg-opacity-10",
                  stat.color === 'emerald' ? "bg-emerald-500 text-emerald-500" :
                  stat.color === 'orange' ? "bg-orange-500 text-orange-500" :
                  stat.color === 'blue' ? "bg-blue-500 text-blue-500" :
                  "bg-red-500 text-red-500"
                )}>
                  <stat.icon size={20} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                  stat.trend === 'up' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-100 text-red-600 dark:bg-red-500/10"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Fee Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle>Student Payment Records</CardTitle>
            <CardDescription>Recent transactions and pending dues.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search fees..." 
                className="bg-secondary/50 border-none rounded-lg pl-9 py-1.5 text-xs w-48 outline-none focus:ring-1 focus:ring-primary/20" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground text-left">
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFees.map((fee, i) => (
                <tr key={fee.id || i} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{fee.name}</span>
                      <span className="text-[10px] text-muted-foreground">{fee.studentId} | {fee.class}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">${fee.total.toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono text-emerald-600">${fee.paid.toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono text-red-600">${fee.pending.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      fee.status === 'Paid' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10" :
                      fee.status === 'Partial' ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10" :
                      "bg-red-100 text-red-600 dark:bg-red-500/10"
                    )}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{fee.dueDate}</td>
                  <td className="px-6 py-4 text-right">
                    {fee.pending > 0 ? (
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary animate-pulse" onClick={() => handleSendReminder(fee.id)}>
                        <Send size={12} /> Remind
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => toast.info("Downloading receipt...")}>
                        <Download size={12} /> Receipt
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin Fee Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-secondary/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-secondary/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-card-foreground">Generate Student Fees</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Generate monthly tuition and registration statements</p>
              </div>
              <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-muted-foreground hover:bg-secondary" onClick={() => setShowCreateModal(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleCreateFees} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tab Switcher */}
              <div className="flex bg-secondary/30 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCreateTab("bulk")}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    createTab === "bulk" ? "bg-card text-card-foreground shadow" : "text-muted-foreground hover:text-card-foreground"
                  )}
                >
                  Bulk Monthly Fees
                </button>
                <button
                  type="button"
                  onClick={() => setCreateTab("single")}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    createTab === "single" ? "bg-card text-card-foreground shadow" : "text-muted-foreground hover:text-card-foreground"
                  )}
                >
                  Individual Student Invoice
                </button>
              </div>

              {createTab === "bulk" ? (
                /* BULK TAB */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Classroom / Roster Target</label>
                    <select
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      value={bulkClass}
                      onChange={(e) => setBulkClass(e.target.value)}
                    >
                      <option value="All">All Classrooms & Students</option>
                      {classes.map(cls => (
                        <option key={cls.id || cls.name} value={cls.name}>{cls.name} ({cls.teacher_name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Statement description / Month</label>
                    <input
                      type="text"
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      value={bulkDesc}
                      onChange={(e) => setBulkDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billed Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20 font-mono"
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
                      <input
                        type="text"
                        className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                        value={bulkDueDate}
                        onChange={(e) => setBulkDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* SINGLE TAB */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Student</label>
                    <select
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      value={singleStudent}
                      onChange={(e) => setSingleStudent(e.target.value)}
                      required
                    >
                      <option value="">-- Choose student from roster --</option>
                      {students.map(std => (
                        <option key={std.id} value={std.student_id}>{std.name} ({std.student_id}) - {std.grade}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Statement description / Month</label>
                    <input
                      type="text"
                      className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      value={singleDesc}
                      onChange={(e) => setSingleDesc(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Billed Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20 font-mono"
                        value={singleAmount}
                        onChange={(e) => setSingleAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Due Date</label>
                      <input
                        type="text"
                        className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                        value={singleDueDate}
                        onChange={(e) => setSingleDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                >
                  {submitting && <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Generate Statements</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
