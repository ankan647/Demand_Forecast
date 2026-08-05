"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

export interface NavBarProps {
  items: NavItem[]
  className?: string
  activeTab?: string
  onTabChange?: (name: string) => void
}

export function NavBar({ items, className, activeTab: propActiveTab, onTabChange }: NavBarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(items[0]?.name || '')

  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab

  const handleTabClick = (item: NavItem) => {
    setInternalActiveTab(item.name)
    if (onTabChange) {
      onTabChange(item.name)
    }
  }

  return (
    <div
      className={cn(
        "z-50 inline-flex",
        className,
      )}
    >
      <div className="flex items-center gap-1 sm:gap-2 bg-background/5 border border-border backdrop-blur-lg py-1 px-1.5 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url || '#'}
              onClick={(e: React.MouseEvent) => {
                if (!item.url || item.url.startsWith('#')) {
                  e.preventDefault()
                }
                handleTabClick(item)
              }}
              className={cn(
                "relative cursor-pointer text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors flex items-center gap-1.5 sm:gap-2",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
              )}
            >
              <Icon size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
