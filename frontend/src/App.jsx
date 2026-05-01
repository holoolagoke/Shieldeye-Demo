import { useState } from "react"
import axios from "axios"

const API = "http://localhost:5000"

export default function App() {
  const [view, setView] = useState("login")
  const [token, setToken] = useState("")
  const [form, setForm] = useState({ username: "", password: "" })
  const [ticket, setTicket] = useState({ title: "", content: "" })
  const [tickets, setTickets] = useState([])

  const handleAuth = async (type) => {
    try {
      const res = await axios.post(`${API}/api/${type}`, form)
      if (type === "login") {
        setToken(res.data.token)
        fetchTickets(res.data.token)
        setView("dashboard")
      } else {
        alert("Signup successful")
        setView("login")
      }
    } catch (err) {
      alert(err.response?.data?.message)
    }
  }

  const fetchTickets = async (tok = token) => {
    const res = await axios.get(`${API}/api/tickets`, {
      headers: { Authorization: `Bearer ${tok}` }
    })
    setTickets(res.data)
  }

  const createTicket = async () => {
    await axios.post(`${API}/api/tickets`, ticket, {
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchTickets()
  }

  if (view === "login" || view === "signup") {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl mb-4">{view}</h2>

        <input
          className="border p-2 w-full mb-2"
          placeholder="username"
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          className="border p-2 w-full mb-2"
          placeholder="password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 w-full"
          onClick={() => handleAuth(view)}
        >
          {view}
        </button>

        <p
          className="mt-3 text-sm cursor-pointer"
          onClick={() => setView(view === "login" ? "signup" : "login")}
        >
          Switch to {view === "login" ? "signup" : "login"}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl mb-4">Dashboard</h2>

      <input
        className="border p-2 w-full mb-2"
        placeholder="title"
        onChange={e => setTicket({ ...ticket, title: e.target.value })}
      />
      <textarea
        className="border p-2 w-full mb-2"
        placeholder="content"
        onChange={e => setTicket({ ...ticket, content: e.target.value })}
      />

      <button
        className="bg-green-500 text-white px-4 py-2 mb-4"
        onClick={createTicket}
      >
        Create Ticket
      </button>

      <div>
        {tickets.map(t => (
          <div key={t.id} className="border p-2 mb-2">
            <h3 className="font-bold">{t.title}</h3>
            <p>{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}