# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of FlowCraft seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

1. **GitHub Security Advisories (Preferred)**: Use the ["Report a Vulnerability"](https://github.com/imerljak/flow-craft/security/advisories/new) tab in the Security section of this repository.

2. **Email**: Send an email to the project maintainers with details of the vulnerability. You can find contact information in the repository.

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, CSRF, privilege escalation)
- Full paths of affected source file(s)
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 3 business days.
- **Communication**: We will keep you informed about our progress in addressing the vulnerability.
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days of initial report.
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous).

## Security Update Process

1. The security report is received and assigned to a primary handler
2. The problem is confirmed and affected versions are determined
3. Code is audited to find any similar problems
4. Fixes are prepared for all supported releases
5. Fixes are released and security advisory is published

## Browser Extension Security Considerations

As a browser extension, FlowCraft handles sensitive operations including:

- Network request interception and modification
- Script injection into web pages
- Local storage of user configurations

We are committed to:

- Following Chrome Extension Manifest V3 security best practices
- Minimizing required permissions
- Ensuring all data is stored locally and privately
- Regular security audits of dependencies
- Transparent disclosure of any security issues

## Scope

This security policy applies to the FlowCraft browser extension and all related infrastructure hosted in this repository.

### In Scope

- Browser extension code (background scripts, content scripts)
- Request interception mechanisms
- Data storage and privacy
- Permissions and capabilities
- Dependencies and third-party code

### Out of Scope

- Issues in third-party websites where the extension is used
- User configuration errors
- Browser bugs (please report to browser vendors)

## Safe Harbor

We support responsible disclosure. If you follow these guidelines when reporting a vulnerability:

- We will not pursue legal action against you
- We will work with you to understand and address the issue promptly
- We will publicly acknowledge your responsible disclosure (if you wish)

Thank you for helping keep FlowCraft and our users safe!
