"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Divider,
  Button
} from "@nextui-org/react";
import { GithubIcon, HeyGenLogo } from "./Icons";
import { useState } from "react";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="pt-4">
      <NavbarContent justify="start" className="pr-3" >
        <NavbarBrand>
          <Link aria-label="Chat AI" href="/">
            <button
              type="button"
              className="rounded-full bg-red-800 px-4 py-2 text-sm text-white hover:bg-red-900"
            >
              Chat With AI Giuseppe
            </button>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="center" className="hidden sm:flex" >
        <NavbarItem className="isolate inline-flex rounded-full shadow-sm">
          <Link
            color="foreground"
            href="/about#experience"
          >
            <button
              type="button"
              className="relative inline-flex items-center rounded-l-full bg-white pl-5 pr-3 py-2 text-sm text-gray-900 hover:bg-gray-50 focus:z-10"
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
              className="relative -ml-px inline-flex items-center bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 focus:z-10"
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
              className="relative -ml-px inline-flex items-center rounded-r-full bg-white pl-3 pr-5 py-2 text-sm text-gray-900 hover:bg-gray-50 focus:z-10"
            >
              Contact
            </button>
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end" className="sm:hidden">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
      </NavbarContent>

      <NavbarMenu>
          <NavbarMenuItem  className="pt-10">
            <Link
              className="w-full text-black text-4xl underline"
              href="/about#experience"
              size="lg"
            >
              Experience
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className="w-full text-black text-4xl underline"
              href="/about#newsletter"
              size="lg"
            >
              Newsletter
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className="w-full text-black text-4xl underline"
              href="/about#contact"
              size="lg"
            >
              Contact
            </Link>
          </NavbarMenuItem>
          <Divider className="my-6" />
          <div className="">
            <Button size="lg" className="w-full rounded-full">
              Contact Me
            </Button>
          </div>
      </NavbarMenu>

    </Navbar>
  );
}
