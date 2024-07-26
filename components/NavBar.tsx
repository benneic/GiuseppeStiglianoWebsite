"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import { GithubIcon, HeyGenLogo } from "./Icons";
import { ThemeSwitch } from "./ThemeSwitch";

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <NavbarBrand>
        <Link aria-label="Chat AI" href="/">
          <button
            type="button"
            className="rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
          >
            Chat With AI Giuseppe
          </button>
        </Link>
      </NavbarBrand>
      <NavbarContent justify="center">
        <NavbarItem className="isolate inline-flex rounded-full shadow-sm">
          <Link
            color="foreground"
            href="/about#experience"
          >
            <button
              type="button"
              className="relative inline-flex items-center rounded-l-full bg-white pl-5 pr-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
            >
              Experience
            </button>
          </Link>
          <Link
            color="foreground"
            href="/about#newsletter"
          >
            <button
              type="button"
              className="relative -ml-px inline-flex items-center bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
            >
              Newsletter
            </button>
          </Link>
          <Link
            color="foreground"
            href="/about#contact"
          >
            <button
              type="button"
              className="relative -ml-px inline-flex items-center rounded-r-full bg-white pl-3 pr-5 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
            >
              Contact
            </button>
          </Link>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
