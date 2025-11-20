# Supabase MCP Server Setup

This project is now configured with a Supabase MCP (Model Context Protocol) server, allowing AI assistants like Claude Code to interact directly with your Supabase database.

## What Was Configured

1. **Package Installation**: Added `@supabase/mcp-server-supabase` to devDependencies
2. **MCP Configuration**: Created [.mcp.json](.mcp.json) with Supabase server configuration
3. **Environment Template**: Created [.env.example](.env.example) for environment variables

## How to Use

### Automatic Authentication (Recommended)

When Claude Code starts, it will automatically prompt you to authenticate with Supabase:
1. A browser window will open
2. Log in to your Supabase account
3. Grant access to the MCP server
4. Select the organization containing project `qqewusetilxxfvfkmsed`

### Current Configuration

The MCP server is configured with:
- **Project Reference**: `qqewusetilxxfvfkmsed`
- **Read-Only Mode**: Enabled (safer for AI interactions)
- **Command**: `npx -y @supabase/mcp-server-supabase@latest`

### Available Features

Once connected, Claude Code can:
- Query your database tables (candidates, incidents, roster_schedules, profiles)
- Analyze database schema and relationships
- Generate SQL queries
- Provide insights about your data
- Help with database optimization

### Security Notes

- ✅ The server runs in **read-only mode** by default
- ✅ All queries are executed as read-only transactions
- ✅ No modifications to your database can be made through the MCP server
- ⚠️ To enable write operations, remove the `--read-only` flag from [.mcp.json](.mcp.json) and add `SUPABASE_SERVICE_ROLE_KEY` to your environment

### Enabling Write Operations (Optional)

If you need write access:

1. Get your service role key from: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed/settings/api
2. Create a `.env` file and add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. Edit [.mcp.json](.mcp.json) and remove the `--read-only` flag
4. Update the `env` section:
   ```json
   "env": {
     "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
   }
   ```

### Testing the Connection

To verify the MCP server is working:
1. Restart Claude Code
2. Ask: "Can you show me the schema of the candidates table?"
3. Claude should be able to query and return the schema information

## Additional Configuration Options

### Feature Groups

You can customize which features are available by adding the `--features` flag:

```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--project-ref", "qqewusetilxxfvfkmsed",
  "--features", "database,storage,auth"
]
```

### Multiple Projects

To add multiple Supabase projects, add more entries to the `mcpServers` object:

```json
{
  "mcpServers": {
    "supabase-prod": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "project-1"]
    },
    "supabase-dev": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref", "project-2"]
    }
  }
}
```

## Troubleshooting

### Connection Issues

- Ensure you're authenticated with Supabase
- Check that the project reference `qqewusetilxxfvfkmsed` is correct
- Verify network connectivity to Supabase

### Permission Errors

- Confirm you have access to the Supabase project
- Check that your account has the appropriate permissions
- For write operations, verify the service role key is correct

## Documentation

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.claude.com/en/docs/claude-code/mcp)
