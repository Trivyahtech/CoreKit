import Link from "next/link";
import { BRAND } from "@/common/config/brand";

export function StorefrontFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-card-border bg-card-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-sky-500 to-amber-500">
                {BRAND.name}
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted max-w-sm">
              {BRAND.description}
            </p>
            <p className="mt-3 text-xs text-muted">
              Questions? Call {BRAND.phone} or email {BRAND.supportEmail}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Shop
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/products?category=ncc-t-shirts">
                  NCC T-shirts
                </Link>
              </li>
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/products?category=ncc-camp-badges">
                  Camp badges
                </Link>
              </li>
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/products?category=ncc-ranks">
                  Ranks
                </Link>
              </li>
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/products?category=books-study">
                  Books
                </Link>
              </li>
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/categories">
                  All categories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Help
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/account">
                  My account
                </Link>
              </li>
              <li>
                <Link className="text-foreground/80 hover:text-accent" href="/orders">
                  Track orders
                </Link>
              </li>
              <li>
                <a className="text-foreground/80 hover:text-accent" href="#">
                  Shipping &amp; Returns
                </a>
              </li>
              <li>
                <a className="text-foreground/80 hover:text-accent" href="#">
                  Privacy
                </a>
              </li>
              <li>
                <a className="text-foreground/80 hover:text-accent" href="#">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-card-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted">
            © {year} {BRAND.copyrightOwner}. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Secure payments · SSL encrypted checkout
          </p>
        </div>
      </div>
    </footer>
  );
}
