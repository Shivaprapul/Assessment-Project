/**
 * Landing Page
 * 
 * Redirects to login page for authenticated users,
 * or shows landing page for unauthenticated users.
 * 
 * @module app/page
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // For MVP, redirect to login
  redirect('/login');
}
