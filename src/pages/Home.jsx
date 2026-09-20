import { Link } from 'react-router-dom'

function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <Link to="/kid">
        <button>Kid Dashboard</button>
      </Link>
    </div>
  )
}

export default Home