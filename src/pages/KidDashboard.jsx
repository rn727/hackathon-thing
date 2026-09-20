import { Link } from 'react-router-dom'
import './KidDashboard.css'

function KidDashboard() {
  return (
    <div className="dashboard">
        <div className="top_left">
        
        </div>
        <div className="main_section">
      <h1>(L)earn</h1>

      <h2>Balance</h2>
      <p>$25.00</p>

      <h2>Available Tasks</h2>

      <div>
        <h3>Finish Math Homework</h3>
        <p>Reward: $5.00</p>
        <button>Accept Task</button>
      </div>

      <br />

      <Link to="/">
        <button>Back</button>
      </Link>
      </div>
    </div>
  )
}

export default KidDashboard