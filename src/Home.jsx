import { Link } from 'react-router-dom'
import './parent/parent.css'
import './Home.css'

export default function Home() {
  return (
    <div className="parent-page login-page">
      <h1>TaskPay</h1>

      <section className="p-card">
        <h2>Welcome! Choose your dashboard</h2>
        <p className="p-muted">Select how you want to enter the app.</p>

        <div className="login-options">
          <Link to="/parent">
            <button className="login-button">
              Log in as Parent
            </button>
          </Link>

          <Link to="/kid">
            <button className="login-button">
              Log in as Child
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}