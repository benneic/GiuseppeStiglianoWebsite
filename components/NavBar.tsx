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
  Button,
} from "@nextui-org/react";
import { useState } from "react";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar
      classNames={{
        base: ["sm:pt-4"],
        wrapper: ["sm:px-0"],
      }}
      maxWidth="full"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="pr-3" justify="start">
        <NavbarBrand>
          <button className="py-3 text-[16px] text-white" type="button">
            AI Giuseppe
          </button>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex text-sm" justify="end">
        <NavbarItem className="isolate inline-flex rounded-full shadow-sm">
          <Link color="foreground" href="https://giuseppestigliano.com">
            <button
              className="relative h-[40] inline-flex items-center rounded-l-full bg-white pl-6 pr-3 py-3 text-[16px] text-gray-900 hover:bg-gray-50 focus:z-10"
              type="button"
            >
              Home
            </button>
          </Link>
          <Link
            color="foreground"
            href="https://giuseppestigliano.com/#experience"
          >
            <button
              className="relative h-[40] -ml-px inline-flex items-center bg-white px-3 py-3 text-[16px] text-gray-900 hover:bg-gray-50 focus:z-10"
              type="button"
            >
              Experience
            </button>
          </Link>
          <Link
            color="foreground"
            href="https://giuseppestigliano.com/#ai"
          >
            <button
              className="relative h-[40] -ml-px inline-flex items-center bg-white px-3 py-3 text-[16px] text-gray-900 hover:bg-gray-50 focus:z-10"
              type="button"
            >
              AI
            </button>
          </Link>
          <Link
            color="foreground"
            href="https://giuseppestigliano.com/#newsletter"
          >
            <button
              className="relative h-[40] -ml-px inline-flex items-center bg-white px-3 py-3 text-[16px] text-gray-900 hover:bg-gray-50 focus:z-10"
              type="button"
            >
              Newsletter
            </button>
          </Link>
          <Link
            color="foreground"
            href="https://giuseppestigliano.com/#contact"
          >
            <button
              className="relative h-[40] -ml-px inline-flex items-center rounded-r-full bg-white pl-3 pr-6 py-3 text-[16px] text-gray-900 hover:bg-gray-50 focus:z-10"
              type="button"
            >
              Contact
            </button>
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden" justify="end">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        />
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem className="pt-10">
          <Link
            className="w-full text-black text-4xl underline"
            href="https://giuseppestigliano.com/"
            size="lg"
          >
            Home
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            className="w-full text-black text-4xl underline"
            href="https://giuseppestigliano.com/#experience"
            size="lg"
          >
            Experience
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            className="w-full text-black text-4xl underline"
            href="https://giuseppestigliano.com/#ai"
            size="lg"
          >
            AI
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            className="w-full text-black text-4xl underline"
            href="https://giuseppestigliano.com/#newsletter"
            size="lg"
          >
            Newsletter
          </Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link
            className="w-full text-black text-4xl underline"
            href="https://giuseppestigliano.com/#contact"
            size="lg"
          >
            Contact
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
