import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Users,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  Search,
  X,
  ShieldCheck,
} from "lucide-react";
import api from "./api";

const emptyStudent = {
  full_name: "",
  email: "",
  phone: "",
  course: "",
  room_id: "",
  username: "",
  password: "",
};
const emptyRoom = { room_number: "", capacity: 2, room_type: "Standard" };

function Login({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      localStorage.setItem("hostel_token", data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to log in");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-slate-950">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white">
            <BedDouble />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HostelHub</h1>
            <p className="text-sm text-slate-500">Hostel Management System</p>
          </div>
        </div>
        <h2 className="text-xl font-semibold">Welcome back</h2>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Sign in to continue to your dashboard.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            Username
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-5 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900">
          <b>Demo admin:</b> admin / Admin@123
          <br />
          Change this password before real deployment.
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [editing, setEditing] = useState(null);

  async function loadData(role = user?.role) {
    if (!localStorage.getItem("hostel_token")) return;
    setLoading(true);
    setError("");
    try {
      const roomResponse = await api.get("/rooms");
      setRooms(roomResponse.data);
      if (role === "admin") {
        const response = await api.get("/students");
        setStudents(response.data);
      } else {
        const response = await api.get("/students/me");
        setStudents([response.data]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load data");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (localStorage.getItem("hostel_token"))
      api
        .get("/auth/me")
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem("hostel_token");
        });
  }, []);
  useEffect(() => {
    if (user) loadData(user.role);
  }, [user]);
  async function logout() {
    localStorage.removeItem("hostel_token");
    setUser(null);
    setStudents([]);
    setRooms([]);
  }
  function openStudent(student = null) {
    setEditing(student?.id ?? null);
    setStudentForm(
      student
        ? {
            full_name: student.full_name,
            email: student.email,
            phone: student.phone || "",
            course: student.course || "",
            room_id: student.room_id || "",
            username: "",
            password: "",
          }
        : emptyStudent,
    );
    setModal("student");
  }
  function openRoom(room = null) {
    setEditing(room?.id ?? null);
    setRoomForm(
      room
        ? {
            room_number: room.room_number,
            capacity: room.capacity,
            room_type: room.room_type,
          }
        : emptyRoom,
    );
    setModal("room");
  }
  async function saveStudent(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    const payload = {
      ...studentForm,
      room_id: studentForm.room_id ? Number(studentForm.room_id) : null,
    };
    try {
      if (editing) {
        delete payload.username;
        delete payload.password;
        await api.put(`/students/${editing}`, payload);
      } else {
        payload.room_id = payload.room_id || null;
        await api.post("/students", payload);
      }
      setModal(null);
      await loadData();
      setNotice(
        editing
          ? "Student updated successfully."
          : "Student created successfully.",
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save student");
    }
  }
  async function saveRoom(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = { ...roomForm, capacity: Number(roomForm.capacity) };
      if (editing) await api.put(`/rooms/${editing}`, payload);
      else await api.post("/rooms", payload);
      setModal(null);
      await loadData();
      setNotice(
        editing ? "Room updated successfully." : "Room created successfully.",
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save room");
    }
  }
  async function deleteStudent(student) {
    if (
      !confirm(
        `Delete student ${student.full_name}? This also deletes their login.`,
      )
    )
      return;
    try {
      await api.delete(`/students/${student.id}`);
      await loadData();
      setNotice("Student deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to delete student");
    }
  }
  async function deleteRoom(room) {
    if (!confirm(`Delete room ${room.room_number}?`)) return;
    try {
      await api.delete(`/rooms/${room.id}`);
      await loadData();
      setNotice("Room deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to delete room");
    }
  }

  const filteredStudents = useMemo(
    () =>
      students.filter((s) =>
        `${s.full_name} ${s.email} ${s.course || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [students, query],
  );
  const filteredRooms = useMemo(
    () =>
      rooms.filter((r) =>
        `${r.room_number} ${r.room_type}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rooms, query],
  );
  if (!user) return <Login onLogin={setUser} />;
  const admin = user.role === "admin";
  const currentStudent = students[0];
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(admin ? [{ id: "students", label: "Students", icon: Users }] : []),
    { id: "rooms", label: "Rooms", icon: BedDouble },
  ];
  const pageTitle =
    {
      dashboard: "Dashboard",
      students: "Student Management",
      rooms: "Room Management",
    }[page] || "Dashboard";

  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-slate-950 p-5 text-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="rounded-xl bg-indigo-500 p-2">
            <BedDouble size={22} />
          </div>
          <div>
            <div className="font-bold">HostelHub</div>
            <div className="text-xs text-slate-400">Management portal</div>
          </div>
        </div>
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                setQuery("");
                setError("");
                setNotice("");
              }}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${page === item.id ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 rounded-2xl bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold capitalize">
              {user.role} access
            </span>
          </div>
          <p className="mt-1 break-all text-xs text-slate-400">
            Signed in as {user.username}
          </p>
        </div>
        <button
          onClick={logout}
          className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-slate-800 lg:mt-auto"
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:ml-64">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Hostel administration / {pageTitle}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="capitalize">{user.role}</span> account
          </div>
        </header>
        {error && (
          <div className="mb-4 flex justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <button onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div className="mb-4 flex justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
            <button onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {loading && (
          <p className="mb-4 text-sm text-slate-500">Loading data…</p>
        )}
        {page === "dashboard" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-600 p-6 text-white sm:p-8">
              <p className="text-sm text-indigo-100">
                Good to see you, {user.username} 👋
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {admin ? "Hostel overview" : "Your hostel portal"}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-indigo-100">
                {admin
                  ? "Manage student records, room allocation and occupancy from one place."
                  : "View your profile and check room availability."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {admin && (
                <Stat
                  title="Total students"
                  value={students.length}
                  icon={Users}
                  hint="Registered student records"
                />
              )}
              <Stat
                title="Total rooms"
                value={rooms.length}
                icon={BedDouble}
                hint="Rooms in the hostel"
              />
              <Stat
                title="Available beds"
                value={rooms.reduce(
                  (n, r) => n + Math.max(0, r.capacity - r.occupied),
                  0,
                )}
                icon={BedDouble}
                hint="Across all registered rooms"
              />
            </div>
            {admin ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold">Recent students</h3>
                  <button
                    onClick={() => setPage("students")}
                    className="text-sm font-semibold text-indigo-600"
                  >
                    View all
                  </button>
                </div>
                <StudentTable
                  rows={students.slice(0, 5)}
                  rooms={rooms}
                  admin={false}
                />
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-bold">My student profile</h3>
                {currentStudent ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Full name", currentStudent.full_name],
                      ["Email", currentStudent.email],
                      ["Phone", currentStudent.phone || "—"],
                      ["Course", currentStudent.course || "—"],
                      [
                        "Room",
                        rooms.find((r) => r.id === currentStudent.room_id)
                          ?.room_number || "Not assigned",
                      ],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="mt-1 font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No student profile is linked to this account. Contact an
                    administrator.
                  </p>
                )}
              </section>
            )}
          </div>
        )}
        {page === "students" && admin && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">All students</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {students.length} student records
                </p>
              </div>
              <button
                onClick={() => openStudent()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} /> Add student
              </button>
            </div>
            <SearchBox value={query} onChange={setQuery} />
            <StudentTable
              rows={filteredStudents}
              rooms={rooms}
              admin
              onEdit={openStudent}
              onDelete={deleteStudent}
            />
          </section>
        )}
        {page === "rooms" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Rooms</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {rooms.length} rooms registered
                </p>
              </div>
              {admin && (
                <button
                  onClick={() => openRoom()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus size={17} /> Add room
                </button>
              )}
            </div>
            <SearchBox value={query} onChange={setQuery} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                      <BedDouble size={22} />
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${room.status === "Full" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {room.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold">
                    Room {room.room_number}
                  </h3>
                  <p className="text-sm text-slate-500">{room.room_type}</p>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="text-slate-500">Occupancy</span>
                    <b>
                      {room.occupied} / {room.capacity} beds
                    </b>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(100, (room.occupied / room.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                  {admin && (
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => openRoom(room)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                      <button
                        onClick={() => deleteRoom(room)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!filteredRooms.length && (
                <p className="col-span-full py-10 text-center text-sm text-slate-500">
                  No rooms found.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
      {modal === "student" && (
        <Modal
          title={editing ? "Edit student" : "Add student"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveStudent} className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={studentForm.full_name}
              onChange={(v) => setStudentForm({ ...studentForm, full_name: v })}
              required
            />
            <Field
              label="Email"
              type="email"
              value={studentForm.email}
              onChange={(v) => setStudentForm({ ...studentForm, email: v })}
              required
            />
            <Field
              label="Phone"
              value={studentForm.phone}
              onChange={(v) => setStudentForm({ ...studentForm, phone: v })}
            />
            <Field
              label="Course"
              value={studentForm.course}
              onChange={(v) => setStudentForm({ ...studentForm, course: v })}
            />
            <label className="block text-sm font-medium">
              Assign room
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"
                value={studentForm.room_id}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, room_id: e.target.value })
                }
              >
                <option value="">No room assigned</option>
                {rooms
                  .filter(
                    (r) =>
                      r.status !== "Full" ||
                      String(r.id) === String(studentForm.room_id),
                  )
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} ({r.occupied}/{r.capacity})
                    </option>
                  ))}
              </select>
            </label>
            {!editing && (
              <>
                <Field
                  label="Login username"
                  value={studentForm.username}
                  onChange={(v) =>
                    setStudentForm({ ...studentForm, username: v })
                  }
                  required
                />
                <Field
                  label="Temporary password (min 8 chars)"
                  type="password"
                  value={studentForm.password}
                  onChange={(v) =>
                    setStudentForm({ ...studentForm, password: v })
                  }
                  required
                />
              </>
            )}
            <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">
                Save student
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "room" && (
        <Modal
          title={editing ? "Edit room" : "Add room"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveRoom} className="space-y-4">
            <Field
              label="Room number"
              value={roomForm.room_number}
              onChange={(v) => setRoomForm({ ...roomForm, room_number: v })}
              required
            />
            <Field
              label="Capacity (beds)"
              type="number"
              value={roomForm.capacity}
              onChange={(v) => setRoomForm({ ...roomForm, capacity: v })}
              required
            />
            <label className="block text-sm font-medium">
              Room type
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"
                value={roomForm.room_type}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, room_type: e.target.value })
                }
              >
                <option>Standard</option>
                <option>AC</option>
                <option>Non-AC</option>
                <option>Deluxe</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">
                Save room
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({ title, value, icon: Icon, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
function SearchBox({ value, onChange }) {
  return (
    <div className="relative mb-5">
      <Search
        size={17}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        placeholder="Search…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm"
      />
    </div>
  );
}
function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"
      />
    </label>
  );
}
function StudentTable({ rows, rooms, admin, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3">Student</th>
            <th className="px-3 py-3">Course</th>
            <th className="px-3 py-3">Room</th>
            {admin && <th className="px-3 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.id}
              className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
            >
              <td className="px-3 py-4">
                <div className="font-semibold">{s.full_name}</div>
                <div className="mt-1 text-xs text-slate-500">{s.email}</div>
                <div className="text-xs text-slate-500">{s.phone || ""}</div>
              </td>
              <td className="px-3 py-4">{s.course || "—"}</td>
              <td className="px-3 py-4">
                {rooms.find((r) => r.id === s.room_id)?.room_number ||
                  "Not assigned"}
              </td>
              {admin && (
                <td className="px-3 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      title="Edit"
                      onClick={() => onEdit(s)}
                      className="rounded-lg border p-2 hover:bg-white"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => onDelete(s)}
                      className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                colSpan={admin ? 4 : 3}
                className="px-3 py-10 text-center text-slate-500"
              >
                No student records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
