import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Github,
  ExternalLink,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Cloud,
  Code,
  Database,
  Server,
  Monitor,
  ChevronRight,
  Play,
  CheckCircle,
  Terminal,
  Layers,
  GitBranch,
  Activity,
} from "lucide-react";

function RedisInspiredLanding({ onNavigate }) {
  const [terminalText, setTerminalText] = useState("");
  const [currentCommand, setCurrentCommand] = useState(0);

  const commands = [
    "curl -X POST https://webhooks.dev/user_abc123",
    '{"event": "payment.success", "amount": 1000}',
    "✓ Webhook processed in 45ms",
  ];

  // Terminal animation
  useEffect(() => {
    if (currentCommand < commands.length) {
      const command = commands[currentCommand];
      let i = 0;
      const timer = setInterval(() => {
        if (i <= command.length) {
          setTerminalText((prev) => {
            const lines = prev.split("\n");
            lines[currentCommand] = "$ " + command.slice(0, i);
            return lines.join("\n");
          });
          i++;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            setCurrentCommand((prev) => prev + 1);
          }, 1000);
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [currentCommand]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">WebhookStream</span>
          </div>
          <div className="flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Features
            </a>
            <a
              href="#tech"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Tech Stack
            </a>
            <button
              onClick={() => onNavigate("demo")}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-medium"
            >
              Live Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Activity className="h-4 w-4 mr-2" />
              Real-time webhook processing
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Webhook
              <br />
              <span className="text-red-500">Processing</span>
              <br />
              Made Simple
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              High-performance webhook processor built with Node.js, React, and
              MongoDB. Handle thousands of webhooks with real-time analytics and
              zero downtime.
            </p>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate("demo")}
                className="group bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition-colors font-medium flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Try it live
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="https://github.com/shivamgupta88/webhook-processor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
              >
                <Github className="h-4 w-4 mr-2" />
                View source
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>

          {/* Terminal Demo */}
          <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm">
            <div className="flex items-center mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-400 ml-4">webhook-demo</span>
            </div>
            <div className="text-green-400 space-y-2 min-h-[120px]">
              <pre className="whitespace-pre-wrap">{terminalText}</pre>
              <div className="w-2 h-5 bg-green-400 animate-pulse inline-block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Response Time", value: "< 100ms" },
              { label: "Throughput", value: "10K/sec" },
              { label: "Uptime", value: "99.99%" },
              { label: "Sources", value: "50+" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Scale
            </h2>
            <p className="text-xl text-gray-600">
              Enterprise-grade features for modern applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Real-time Processing",
                description:
                  "Process webhooks instantly with live dashboard updates and sub-100ms response times.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Security First",
                description:
                  "HMAC signature verification, rate limiting, and payload validation built-in.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Analytics & Monitoring",
                description:
                  "Comprehensive metrics, success rates, and performance tracking.",
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Multi-Source Support",
                description:
                  "Works with GitHub, Stripe, Shopify, Slack, and custom webhooks.",
              },
              {
                icon: <Cloud className="h-6 w-6" />,
                title: "Cloud Native",
                description:
                  "Horizontally scalable with Redis queues and MongoDB clustering.",
              },
              {
                icon: <Code className="h-6 w-6" />,
                title: "Developer Friendly",
                description:
                  "RESTful APIs, comprehensive docs, and easy integration.",
              },
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center text-red-500 mb-4 group-hover:bg-red-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Architecture
            </h2>
            <p className="text-xl text-gray-600">
              Scalable, maintainable, production-ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Monitor className="h-8 w-8" />,
                title: "Frontend",
                techs: ["React 18", "Tailwind CSS", "Real-time UI"],
                color: "border-blue-200 bg-blue-50",
              },
              {
                icon: <Server className="h-8 w-8" />,
                title: "Backend",
                techs: ["Node.js", "Express", "JWT Auth"],
                color: "border-green-200 bg-green-50",
              },
              {
                icon: <Database className="h-8 w-8" />,
                title: "Data Layer",
                techs: ["MongoDB", "Redis", "Bull Queues"],
                color: "border-purple-200 bg-purple-50",
              },
            ].map((layer, index) => (
              <div
                key={index}
                className={`border-2 ${layer.color} rounded-lg p-6 text-center`}
              >
                <div className="flex justify-center mb-4 text-gray-700">
                  {layer.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {layer.title}
                </h3>
                <div className="space-y-2">
                  {layer.techs.map((tech, techIndex) => (
                    <div
                      key={techIndex}
                      className="bg-white px-3 py-1 rounded text-sm font-medium text-gray-700"
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Technology Stack
            </h2>
            <p className="text-xl text-gray-600">
              Modern technologies for high performance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: "React", logo: "⚛️" },
              { name: "Node.js", logo: "🟢" },
              { name: "MongoDB", logo: "🍃" },
              { name: "Redis", logo: "🔴" },
              { name: "Express", logo: "🚀" },
              { name: "Tailwind", logo: "🎨" },
            ].map((tech, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {tech.logo}
                </div>
                <div className="font-medium text-gray-900">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to test it out?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Experience the live demo and see how it handles real webhook traffic
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate("demo")}
              className="bg-red-500 text-white px-8 py-3 rounded-md hover:bg-red-600 transition-colors font-medium flex items-center justify-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Launch Demo
            </button>

            <a
              href="https://github.com/shivamgupta88/webhook-processor"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium flex items-center justify-center"
            >
              <Github className="h-4 w-4 mr-2" />
              View Code
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">WebhookStream</span>
            </div>
            <div className="text-sm text-gray-500">
              Built for portfolio demonstration
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default RedisInspiredLanding;
