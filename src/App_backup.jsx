import React from 'react'
import { supabase } from './lib/supabaseClient'
import { useState } from 'react'
import './App.css'

function App() {
  const [dbStatus, setDbStatus] = React.useState('Checking database...');

React.useEffect(() => {
  async function checkDatabase() {
    const { error } = await supabase
      .from('donors')
      .select('id')
      .limit(1);

    setDbStatus(error ? `Database error: ${error.message}` : 'Database connected!');
  }

  checkDatabase();
}, []);
  const [bloodGroup, setBloodGroup] = useState('All')
  const [city, setCity] = useState('')
  const [donors, setDonors] = React.useState([]);
const [searchMessage, setSearchMessage] = React.useState('');
  const [displayName, setDisplayName] = React.useState('')
  const [saveMessage, setSaveMessage] = React.useState('');
const [email, setEmail] = React.useState('');
const [password, setPassword] = React.useState('');
const [authMessage, setAuthMessage] = React.useState('');
async function registerDonor() {
  if (!displayName.trim() || !city.trim() || bloodGroup === 'All') {
    setSaveMessage('Please enter name, city, and select a blood group.');
    


    return;
  }

  setSaveMessage('Saving...');

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    setSaveMessage('Please sign in before registering as a donor.');
    return;
  }

  const { error } = await supabase.from('donors').insert({
    user_id: user.id,
    display_name: displayName,
    blood_group: bloodGroup,
    city: city,
    available: true,
  });

  if (error) {
    setSaveMessage('Error: ' + error.message);
  } else {
    setSaveMessage('Donor registered successfully!');
    setDisplayName('');
    setCity('');
  }
}
async function findDonors() {
  setSearchMessage('Searching...');

  let query = supabase
    .from('donors')
    .select('display_name, blood_group, city')
    .eq('available', true);

  if (bloodGroup !== 'All') {
    query = query.eq('blood_group', bloodGroup);
  }

  if (city.trim()) {
    query = query.ilike('city', `%${city.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    setSearchMessage('Error: ' + error.message);
    setDonors([]);
    return;
  }

  setDonors(data || []);
  setSearchMessage(
    data && data.length > 0
      ? `Found ${data.length} donor(s).`
      : 'No matching donors found.'
  );
}
async function signUp() {
  if (!email.trim() || password.length < 6) {
    setAuthMessage('Enter email and a password of at least 6 characters.');
    return;
  }

  setAuthMessage('Creating account...');

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  setAuthMessage(
    error
      ? error.message
      : 'Account created! Check your email if confirmation is required.'
  );
}

async function logIn() {
  if (!email.trim() || !password) {
    setAuthMessage('Enter your email and password.');
    return;
  }

  setAuthMessage('Signing in...');

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  setAuthMessage(error ? error.message : 'Login successful!');
}

console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase client initialized:', !!supabase)
  return (
    <main>
      <p>{dbStatus}</p>
      <nav className="navbar">
        <h2>🩸 Jeevan</h2>
        <div>
          <a href="#home">Home</a>
          <a href="#donors">Find Donors</a>
          <a href="#request">Emergency Help</a>
        </div>
      </nav>

      <section className="hero" id="home">
        <p className="tag">EVERY DROP COUNTS</p>
        <h1>Be someone's reason<br />to live.</h1>
        <p>Connect with blood donors and help save lives when every second matters.</p>
        <a className="button" href="#donors">Find Blood Donors</a>
      </section>

      <section className="search" id="donors">
        <h2>Find a Blood Donor</h2>

        <label htmlFor="blood">Blood Group</label>
        <select
          id="blood"
          value={bloodGroup}
          onChange={(event) => setBloodGroup(event.target.value)}
        >
          {['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
            <option key={group}>{group}</option>
          ))}
        </select>
<label htmlFor="displayName">Your Name</label>
<input
  id="displayName"
  placeholder="Enter your name"
  value={displayName}
  onChange={(event) => setDisplayName(event.target.value)}
/>
        <label htmlFor="city">City</label>
        <input
          id="city"
          placeholder="Enter your city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
<button type="button" onClick={registerDonor}>
  Register as Donor
</button>

<p>{saveMessage}</p>
        
<section className="auth-form">
  <h2>Login / Sign Up</h2>

  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(event) => setEmail(event.target.value)}
  />

  <label htmlFor="password">Password</label>
  <input
    id="password"
    type="password"
    placeholder="Enter your password"
    value={password}
    onChange={(event) => setPassword(event.target.value)}
  />

  <button type="button" onClick={signUp}>Sign Up</button>
  <button type="button" onClick={logIn}>Login</button>

  <p>{authMessage}</p>
</section>

<button type="button" onClick={findDonors}>
  Find Donors
</button>

<p>{searchMessage}</p>

<div>
  {donors.map((donor, index) => (
    <div key={index}>
      <h3>{donor.display_name}</h3>
      <p>Blood Group: {donor.blood_group}</p>
      <p>City: {donor.city}</p>
    </div>
  ))}
</div>

        <p>Selected group: {bloodGroup}{city && ` | City: ${city}`}</p>
      </section>
    </main>
  )
}

export default App
