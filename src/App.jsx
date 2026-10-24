
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import './App.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [city, setCity] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const [searchGroup, setSearchGroup] = useState('All');
  const [searchCity, setSearchCity] = useState('');
  const [donors, setDonors] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) setSession(data.session);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage('');

    if (!email.trim() || !password) {
      setAuthMessage('Please enter your email and password.');
      return;
    }

    if (authMode === 'signup' && password.length < 6) {
      setAuthMessage('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setSession(data.session);
          setAuthMessage('Account created successfully!');
        } else {
          setAuthMessage(
            'Account created! Check your email to confirm, then log in.'
          );
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        setSession(data.session);
        setPage('dashboard');
      }
    } catch (error) {
      setAuthMessage(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  async function logOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setSession(null);
    setPage('dashboard');
    setEmail('');
    setPassword('');
    setAuthMessage('');
  }

  async function registerDonor(event) {
    event.preventDefault();
    setSaveMessage('');

    if (!displayName.trim() || !city.trim()) {
      setSaveMessage('Please enter your name and city.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaveMessage('Please log in before registering as a donor.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('donors').insert({
  user_id: user.id,
  display_name: displayName.trim(),
  blood_group: bloodGroup,
  city: city.trim(),
  available: true,
});

    setLoading(false);

    if (error) {
      setSaveMessage('Could not save donor profile: ' + error.message);
      return;
    }

    setSaveMessage('Your donor profile has been saved!');
    setDisplayName('');
    setCity('');
  }

  async function findDonors(event) {
    if (event) event.preventDefault();

    setLoading(true);
    setSearchMessage('Searching donors...');
    setDonors([]);

    let query = supabase
      .from('donors')
      .select('display_name, blood_group, city')
      .eq('available', true);

    if (searchGroup !== 'All') {
      query = query.eq('blood_group', searchGroup);
    }

    if (searchCity.trim()) {
      query = query.ilike('city', `%${searchCity.trim()}%`);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      setSearchMessage('Search failed: ' + error.message);
      return;
    }

    setDonors(data || []);
    setSearchMessage(
      data?.length
        ? `${data.length} donor(s) found`
        : 'No matching donors found. Try another city or blood group.'
    );
  }

  if (!authReady) {
    return <div className="app-loading">Jeevan is getting ready...</div>;
  }

  if (!session) {
    return (
      <main className="auth-page">
        <div className="auth-brand">
          <div className="brand-mark">♥</div>
          <span>jeevan<span className="brand-dot">.</span></span>
        </div>

        <div className="auth-layout">
          <section className="auth-story">
            <span className="eyebrow">GIVE BLOOD. GIVE HOPE.</span>
            <h1>One small act.<br />A lifetime of hope.</h1>
            <p>
              Connect with blood donors and help someone get the support
              they need, when every moment matters.
            </p>

            <div className="story-stats">
              <div><strong>01</strong><span>One community</span></div>
              <div><strong>∞</strong><span>Possibilities to help</span></div>
            </div>
          </section>

          <section className="auth-card">
            <span className="eyebrow">WELCOME TO JEEVAN</span>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Sign in to continue your journey of helping others.'
                : 'Join the community and make a difference.'}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => { setAuthMode('login'); setAuthMessage(''); }}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => { setAuthMode('signup'); setAuthMessage(''); }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuth}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button className="primary-button auth-submit" type="submit" disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : authMode === 'login' ? 'Sign in to Jeevan →' : 'Create account →'}
              </button>
            </form>

            {authMessage && <p className="status-message">{authMessage}</p>}

            <p className="privacy-note">Your account helps keep donor profiles connected to their owners.</p>
          </section>
        </div>

        <footer className="site-footer">Jeevan · Every drop counts.</footer>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <button className="brand-button" onClick={() => setPage('dashboard')}>
          <span className="brand-mark">♥</span> jeevan<span className="brand-dot">.</span>
        </button>

        <div className="dashboard-nav-links">
          <button onClick={() => setPage('dashboard')}>Dashboard</button>
          <button onClick={() => setPage('register')}>Become a Donor</button>
          <button onClick={() => setPage('find')}>Find Donors</button>
          <button onClick={() => setPage('emergency')}>Emergency Help</button>
        </div>

        <button className="logout-button" onClick={logOut}>Log out</button>
      </nav>

      <div className="dashboard-content">
        <p className="eyebrow">YOUR JEEVAN SPACE</p>
        <h1>
          {page === 'dashboard' && 'Welcome to your dashboard'}
          {page === 'register' && 'Become a blood donor'}
          {page === 'find' && 'Find blood donors'}
          {page === 'emergency' && 'Emergency help'}
        </h1>
        <p className="dashboard-intro">
          {page === 'dashboard' && 'Every act of kindness can make a difference. How would you like to help today?'}
          {page === 'register' && 'Share your details to make it easier for people in need to find you.'}
          {page === 'find' && 'Search available donor profiles by blood group and city.'}
          {page === 'emergency' && 'If someone needs blood urgently, contact a local hospital or blood bank immediately while looking for potential donors.'}
        </p>

        {page === 'dashboard' && (
          <div className="dashboard-cards">
            <button className="service-card" onClick={() => setPage('register')}>
              <span className="service-icon">♥</span>
              <h2>Register as Donor</h2>
              <p>Add or update your donor profile.</p>
              <span className="card-link">Create profile →</span>
            </button>

            <button className="service-card" onClick={() => setPage('find')}>
              <span className="service-icon">⌕</span>
              <h2>Find Donors</h2>
              <p>Search for donors in your city.</p>
              <span className="card-link">Search donors →</span>
            </button>

            <button className="service-card" onClick={() => setPage('emergency')}>
              <span className="service-icon">✚</span>
              <h2>Emergency Help</h2>
              <p>See what to do when time matters.</p>
              <span className="card-link">Get guidance →</span>
            </button>
          </div>
        )}

        {page === 'register' && (
          <form className="service-panel" onSubmit={registerDonor}>
            <label htmlFor="donor-name">Full name</label>
            <input id="donor-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your full name" required />

            <label htmlFor="donor-blood">Blood group</label>
            <select id="donor-blood" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>

            <label htmlFor="donor-city">City</label>
            <input id="donor-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" required />

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? 'Saving...' : 'Save donor profile'}
            </button>
            {saveMessage && <p className="status-message">{saveMessage}</p>}
          </form>
        )}

        {page === 'find' && (
          <>
            <form className="service-panel" onSubmit={findDonors}>
              <label htmlFor="search-blood">Blood group</label>
              <select id="search-blood" value={searchGroup} onChange={(e) => setSearchGroup(e.target.value)}>
                <option value="All">All blood groups</option>
                {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>

              <label htmlFor="search-city">City</label>
              <input id="search-city" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Enter city (optional)" />

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search available donors'}
              </button>
              {searchMessage && <p className="status-message">{searchMessage}</p>}
            </form>

            <div className="donor-grid">
              {donors.map((donor, index) => (
                <article className="donor-card" key={`${donor.display_name}-${donor.city}-${index}`}>
                  <span className="blood-badge">{donor.blood_group}</span>
                  <h3>{donor.display_name}</h3>
                  <p>⌖ {donor.city}</p>
                  <p className="donor-note">Available donor profile</p>
                </article>
              ))}
            </div>
          </>
        )}

        {page === 'emergency' && (
          <section className="service-panel emergency-panel">
            <h2>Need blood urgently?</h2>
            <ol>
              <li>Contact the hospital treating the patient and ask its blood bank about availability.</li>
              <li>Ask the treating medical team which blood group and component are required.</li>
              <li>Use Find Donors to search nearby profiles and coordinate with the hospital.</li>
              <li>Donors must be screened by the blood bank; do not assume a match guarantees donation eligibility.</li>
            </ol>
            <button className="primary-button" onClick={() => setPage('find')}>Search donor profiles</button>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
