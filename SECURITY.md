# Security Guidelines for Stock Analysis App

## 🔐 Critical Security Measures Implemented

### API Key Protection
- **✅ Environment Variables**: All API keys use environment variables (VITE_FINNHUB_API_KEY, etc.)
- **✅ .env.example**: Template provided with all required keys documented
- **✅ .gitignore**: Enhanced to exclude all .env files and sensitive data
- **✅ .cursorignore**: Prevents sensitive data from being sent to AI models

### File Security
```
PROTECTED FILES:
├── .env (never committed)
├── .env.* (all variants excluded)
├── .taskmaster/config.json (contains AI API keys)
├── .cursor/mcp.json (contains API keys)
├── .windsurf/mcp.json (contains API keys)
├── .roo/mcp.json (contains API keys)
└── **/mcp.json (all MCP configurations)
```

### Build Security
- **✅ Vite Environment**: Uses VITE_ prefix for client-side vars
- **✅ GitHub Actions**: Uses GitHub Secrets for deployment
- **✅ No Hard-coding**: All sensitive data through environment variables

## 🛡️ Security Checklist

### Before Each Commit
- [ ] No API keys in code
- [ ] No .env files committed
- [ ] All sensitive data in environment variables
- [ ] .gitignore up to date
- [ ] .cursorignore excludes sensitive files

### Development Setup
1. Copy `.env.example` to `.env`
2. Fill in your actual API keys
3. Never commit `.env` file
4. Use GitHub Secrets for deployment

### API Key Sources
- **Finnhub**: https://finnhub.io (free tier: 60 calls/minute)
- **Anthropic**: https://console.anthropic.com/
- **Perplexity**: https://www.perplexity.ai/settings/api
- **OpenAI**: https://platform.openai.com/api-keys

## 🚨 Security Violations to Avoid

### ❌ NEVER DO
```typescript
// NEVER hard-code API keys
const apiKey = "pk_1234567890abcdef";
const secret = "sk-abc123def456";
```

### ✅ ALWAYS DO
```typescript
// ALWAYS use environment variables
const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
if (!apiKey) {
  console.warn('⚠️ API key not found');
  // Graceful fallback
}
```

## 🔍 Security Monitoring

### Regular Audits
- Review .gitignore for new patterns
- Check .cursorignore effectiveness
- Audit environment variable usage
- Monitor for accidental commits

### Automated Checks
- GitHub Actions validate environment setup
- Pre-commit hooks (recommended)
- Dependency vulnerability scanning

## 📋 Recovery Procedures

### If API Key Exposed
1. **Immediately revoke** the exposed key
2. **Generate new key** from provider
3. **Update environment variables**
4. **Check git history** for exposure
5. **Force push cleaned history** if needed

### Emergency Contacts
- Finnhub Support: contact@finnhub.io
- Review API usage logs for unauthorized access

## 🔧 Implementation Status

### ✅ Completed Security Measures
- Enhanced .gitignore with comprehensive patterns
- Created .cursorignore files (root + frontend)
- Documented .env.example with security notes
- Updated cursor rules with security best practices
- Verified no sensitive files committed
- TaskMaster configuration secured

### 🔄 Ongoing Security
- Regular dependency updates
- API key rotation (quarterly recommended)
- Security audit reviews
- Monitor for new security patterns

## 📞 Support

For security concerns or questions:
1. Check this documentation first
2. Review .env.example for setup
3. Consult cursor rules for coding practices
4. Contact project maintainer for critical issues

**Remember: Security is everyone's responsibility. When in doubt, err on the side of caution.** 