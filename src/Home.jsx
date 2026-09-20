import { Link } from 'react-router-dom'
import './parent/parent.css'

export default function Home() {
  return (
    <div className="parent-page">
      <h1>Welcome</h1>

      <section className="p-card">
        <h2>Choose your dashboard</h2>
        <p>Select how you want to enter the app.</p>

        <div className="login-options">
          <Link to="/parent">
            <button className="login-button">
              Log in as Parent
            </button>
          </Link>

          <Link to="/kid">
            <button className="login-button">
              Log in as Kid
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}