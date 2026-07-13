"use client";

import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import {
  Sun,
  Moon,
  Bell,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Users,
  Briefcase,
  FolderOpen,
} from "lucide-react";

const navItems = [
  "Dashboard",
  "People",
  "Hiring",
  "Devices",
  "Apps",
  "Salary",
  "Calendar",
  "Reviews",
];

const scheduleEvents = [
  { time: "09:00", title: "Daily Sync", timeRange: "09:30am-10:00am", color: "bg-amber-400", hasAvatar: false },
  { time: "10:00", title: "", timeRange: "", color: "", hasAvatar: false },
  { time: "11:00", title: "Task Review With Team", timeRange: "10:30am-11:30am", color: "bg-gray-200", hasAvatar: false },
  { time: "12:00", title: "Daily Meeting", timeRange: "12:00pm-01:00pm", color: "bg-gray-200", hasAvatar: true },
  { time: "01:00", title: "", timeRange: "", color: "", hasAvatar: false },
  { time: "02:00", title: "", timeRange: "", color: "", hasAvatar: false },
  { time: "03:00", title: "", timeRange: "", color: "", hasAvatar: false },
];

const salaryData = [
  { name: "Yulia Polishchuk", jobTitle: "Head of Design", salary: "$2,500", status: "Paid For", statusColor: "bg-green-100 text-green-700" },
  { name: "Bogdan Nikitin", jobTitle: "Front End Dev...", salary: "$3,000", status: "Absent", statusColor: "bg-red-100 text-red-700" },
  { name: "Daria Yurchenko", jobTitle: "UX/UI Designer", salary: "$1,500", status: "Pending", statusColor: "bg-yellow-100 text-yellow-700" },
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calendarDays = [22, 23, 24, 25, 26, 27, 28];

export default function SuperAdminDashboard() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0e8] via-[#f8f4ec] to-[#fdf9f0] dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">C</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeNav === item
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <button className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 pb-6">
        {/* Greeting Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Hello {user?.firstName || "Admin"}
          </h1>

          <div className="flex items-end justify-between">
            {/* Progress Bars */}
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Interviews</span>
                <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white dark:text-gray-900">70%</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Hired</span>
                <div className="w-20 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-900">10%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Project time</span>
                <div className="w-20 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">15%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Output</span>
                <div className="w-16 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">5%</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-start gap-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-4xl font-light text-gray-900 dark:text-white">91</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Employee</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span className="text-4xl font-light text-gray-900 dark:text-white">104</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Hirings</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <FolderOpen className="w-5 h-5 text-gray-400" />
                  <span className="text-4xl font-light text-gray-900 dark:text-white">185</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Projects</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Schedule Card */}
          <div className="col-span-3 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule</h3>
              <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                <ArrowUpRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Calendar Header */}
            <div className="flex justify-between mb-2">
              {daysOfWeek.map((day) => (
                <span key={day} className="text-[10px] text-gray-400 dark:text-gray-500">
                  {day}
                </span>
              ))}
            </div>
            <div className="flex justify-between mb-4">
              {calendarDays.map((day, i) => (
                <span
                  key={day}
                  className={`text-sm ${
                    i === 3
                      ? "font-bold text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Schedule Events */}
            <div className="space-y-2">
              {scheduleEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 w-10">
                    {event.time}
                  </span>
                  {event.title ? (
                    <div
                      className={`flex-1 ${
                        event.color === "bg-amber-400"
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                          : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                      } rounded-xl px-3 py-2`}
                    >
                      <p className="text-xs font-medium">{event.title}</p>
                      <p className="text-[10px] opacity-70">{event.timeRange}</p>
                      {event.hasAvatar && (
                        <div className="flex -space-x-1 mt-1">
                          <div className="w-5 h-5 rounded-full bg-purple-400 border-2 border-white dark:border-gray-900" />
                          <div className="w-5 h-5 rounded-full bg-pink-400 border-2 border-white dark:border-gray-900" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Salary Card */}
          <div className="col-span-5 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salary</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-white/10 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                  <ArrowUpRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Job Title</th>
                  <th className="pb-2 font-medium">Net Salary</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {salaryData.map((person, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {person.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                      {person.jobTitle}
                    </td>
                    <td className="py-3 text-xs font-medium text-gray-900 dark:text-white">
                      {person.salary}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-medium ${person.statusColor}`}
                      >
                        {person.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Attendance Report Card */}
          <div className="col-span-4 bg-gray-900 dark:bg-black rounded-3xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Attendance Report</h3>
              <button className="p-1 rounded-full hover:bg-white/10">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-light">63</span>
                <ArrowUpRight className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-light">12</span>
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              </div>
            </div>

            {/* Dot Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-full ${
                    Math.random() > 0.3
                      ? "bg-amber-400"
                      : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Hiring Statistics Card */}
          <div className="col-span-8 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Hiring Statistics
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Others</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Design</span>
                </div>
                <div className="flex items-center gap-2">
                  <select className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                    <option>2024</option>
                    <option>2023</option>
                  </select>
                  <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                    <ArrowUpRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 flex items-end justify-between gap-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map(
                (month, i) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-amber-400/50 to-amber-400 rounded-t"
                      style={{ height: `${Math.random() * 100 + 50}px` }}
                    />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{month}</span>
                  </div>
                )
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute top-1/2 left-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 rounded-lg text-xs">
              Others 12
            </div>
          </div>

          {/* Employee Composition Card */}
          <div className="col-span-4 bg-white/70 dark:bg-white/10 backdrop-blur-sm rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Employee Composition
              </h3>
              <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                <ArrowUpRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Donut Chart */}
            <div className="relative flex items-center justify-center mb-4">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="20"
                  strokeDasharray="440"
                  strokeDashoffset="132"
                  className="dark:stroke-amber-400"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">345</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">70%</span>
                <span className="text-gray-400">♀</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                <span className="text-sm text-gray-600 dark:text-gray-300">30%</span>
                <span className="text-gray-400">♂</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
