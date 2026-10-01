import { Link } from 'react-router';
import { buttonClasses } from '../components/button-styles';

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-brand-700">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">Page not found</h1>
        <p className="mt-2 text-sm text-stone-500">The page you're looking for doesn't exist.</p>
        <Link to="/" className={buttonClasses('primary', 'md', 'mt-6')}>
          Go home
        </Link>
      </div>
    </main>
  );
}
