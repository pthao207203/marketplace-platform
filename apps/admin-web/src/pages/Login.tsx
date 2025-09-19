import React from 'react'

export default function Login() {
  return (
    <section className="page">
      <h1>Login</h1>
      <form className="form">
        <label className="form__row">
          <span>Email</span>
          <input type="email" placeholder="you@example.com" />
        </label>
        <label className="form__row">
          <span>Password</span>
          <input type="password" placeholder="••••••••" />
        </label>
        <button className="btn">Sign in</button>
      </form>
    </section>
  )
}
