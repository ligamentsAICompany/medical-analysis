'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  Loader,
  Shield,
  Sparkles,
  Layers,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Multi Model based analysis',
    text: 'Multimodal reasoning on PDFs and clinical imaging.',
  },
  {
    icon: Layers,
    title: 'Structured intelligence',
    text: 'Classification, entities, labs, and imaging-style reports.',
  },
  {
    icon: Sparkles,
    title: 'Glass workspace',
    text: 'Premium cockpit for triage, review, and export.',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState('manoj@meddocs.app');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const from = searchParams.get('from');
      const safe = from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
      router.replace(safe);
    }
  }, [loading, user, router, searchParams]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);
      try {
        await login(email, password);
        const from = searchParams.get('from');
        const safe = from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
        router.replace(safe);
        router.refresh();
      } catch (err) {
        setError(err?.message || 'Sign in failed');
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, login, router, searchParams]
  );

  return (
    <div className="login-card login-card--v2">
      <div className="login-card__head">
        <h2 className="login-card__heading">Welcome back</h2>
        <p className="login-card__lede">Sign in to open your MedDocs workspace.</p>
      </div>

      <form className="login-form login-form--v2" onSubmit={handleSubmit} noValidate>
        <label className="login-field">
          <span className="login-field__label">Work email</span>
          <input
            className="login-field__input"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required
            placeholder="you@hospital.org"
          />
        </label>
        <label className="login-field">
          <span className="login-field__label">Password</span>
          <input
            className="login-field__input"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <p className="login-form__error login-form__error--v2" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn--primary login-form__submit login-form__submit--premium"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader size={16} className="spin" aria-hidden />
              Signing in…
            </>
          ) : (
            <>
              <Shield size={16} aria-hidden />
              Sign in
            </>
          )}
        </button>

        <div className="login-form__divider" aria-hidden />
      </form>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="login-card login-card--loading login-card--v2" aria-busy>
      <Loader size={32} className="spin login-fallback__loader" aria-hidden />
      <p className="login-fallback__text text-muted">Preparing secure session…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page login-page--v2">
      <div className="login-page__noise" aria-hidden />
      <div className="login-page__orb login-page__orb--a" aria-hidden />
      <div className="login-page__orb login-page__orb--b" aria-hidden />
      <div className="login-page__grid">
        <aside className="login-hero" aria-labelledby="login-hero-title">
          <div className="login-hero__top">
            <div className="login-hero__mark" aria-hidden>
              <Activity size={22} strokeWidth={2.2} />
            </div>
            <span className="login-hero__badge">MedDocs</span>
          </div>

          <div className="login-hero__body">
            <p className="login-hero__kicker">
              Clinical intelligence workspace
            </p>
            <h1 id="login-hero-title" className="login-hero__title">
              <span className="login-hero__title-line">Parse. Analyse.</span>
              <span className="login-hero__title-line login-hero__title-line--glow">
                Decide faster.
              </span>
            </h1>
            <p className="login-hero__lead">
              Unified ingestion for documents and imaging — with remote clinical analysis,
              glass dashboards, and audit-friendly flows built for modern care teams.
            </p>

            <ul className="login-hero__features" aria-label="Product highlights">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="login-hero__feature">
                  <span className="login-hero__feature-icon" aria-hidden>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="login-hero__feature-text">
                    <span className="login-hero__feature-title">{title}</span>
                    <span className="login-hero__feature-desc">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </aside>

        <div className="login-aside">
          <div className="login-aside__toolbar">
            <ThemeToggle />
          </div>
          <div className="login-aside__panel">
            <Suspense fallback={<LoginFallback />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
