# Taskfile Guide

Task is a modern task runner / build tool that replaces Makefiles with a simpler YAML syntax.

## Installation

### macOS
```bash
brew install go-task/tap/go-task
```

### Linux
```bash
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b ~/.local/bin
```

### Windows (PowerShell)
```powershell
choco install go-task
```

Or download from: https://taskfile.dev/installation/

## Verify Installation
```bash
task --version
```

## Usage

### View All Available Commands
```bash
task --list
# or simply
task
```

## Common Commands

### Docker Management
```bash
task up              # Start all services
task down            # Stop all services
task restart         # Restart all services
task ps              # Show service status
task logs            # Show all logs
task logs:temporal-worker   # Show specific service logs
```

### Development
```bash
task install         # Install all dependencies
task dev:founder     # Run Founder in dev mode
task dev:temporal-worker   # Run Temporal Worker in dev mode
task dev:temporal-api      # Run Temporal API in dev mode
```

### Testing
```bash
task health          # Check health of all services
task test:workflow   # Test user context workflow (parallel)
task test:workflow:sequential  # Test sequential workflow
task test:payment    # Test payment workflow
```

### Workflow Management
```bash
# Get workflow status
task workflow:status -- user-context-abc123

# Get workflow progress
task workflow:progress -- user-context-abc123

# Get workflow result
task workflow:result -- user-context-abc123

# Cancel workflow
task workflow:cancel -- user-context-abc123

# View workflow history
task workflow:history -- user-context-abc123
```

### Open UIs in Browser
```bash
task ui              # Open Temporal UI
task ui:temporal-api # Open Temporal API Swagger
task ui:founder      # Open Founder Swagger
task ui:fake-stripe  # Open Fake Stripe Swagger
```

### Monitoring
```bash
task stats           # Show Fake Stripe chaos statistics
task stats:reset     # Reset statistics
```

### Database
```bash
task db:shell        # Connect to PostgreSQL
task db:reset        # Reset Temporal database (WARNING: destroys data)
```

### Build
```bash
task build           # Build all TypeScript packages
task build:docker    # Build Docker images
```

### Cleanup
```bash
task clean           # Remove all build artifacts
task clean:docker    # Remove Docker containers and volumes
task reset           # Full reset (clean + reinstall)
```

### Documentation
```bash
task docs            # Show documentation index
```

## Quick Start Examples

### 1. First Time Setup
```bash
# Install dependencies
task install

# Start all services
task up

# Check health
task health

# Open Temporal UI
task ui
```

### 2. Daily Development Workflow
```bash
# Start services
task up

# Run Temporal Worker locally (for debugging)
task dev:temporal-worker

# In another terminal, test workflows
task test:workflow

# View logs
task logs:temporal-worker

# Stop services when done
task down
```

### 3. Test a Workflow End-to-End
```bash
# Start workflow
task test:workflow

# Note the workflow ID from response, then check status
task workflow:status -- user-context-test-20240127123456

# Check progress
task workflow:progress -- user-context-test-20240127123456

# Get result
task workflow:result -- user-context-test-20240127123456

# View in UI
task ui
```

### 4. Debugging Payment Workflow
```bash
# Start payment workflow
task test:payment

# View Fake Stripe stats
task stats

# Check Worker logs for retry attempts
task logs:temporal-worker

# View workflow history in UI
task ui
```

### 5. Reset Everything
```bash
# Full reset (useful if services get stuck)
task clean:docker
task up
task health
```

## Advanced Usage

### Passing Arguments
```bash
# Follow logs in real-time
task logs -- -f

# Follow specific service logs
task logs -- -f temporal-worker

# Get status for specific workflow
task workflow:status -- my-workflow-id-123
```

### Running Multiple Tasks
```bash
# Chain tasks (run sequentially)
task down && task clean:docker && task up

# Or use dependencies in Taskfile (already configured)
task restart  # Runs: down -> up
```

### Environment Variables
```bash
# Override Docker Compose command
DOCKER_COMPOSE=docker-compose task up

# Use different compose file
DOCKER_COMPOSE="docker-compose -f docker-compose.prod.yml" task up
```

## Taskfile Structure

The Taskfile is organized into sections:

1. **Docker Commands** - Service orchestration
2. **Installation & Setup** - Dependency management
3. **Development** - Local dev servers
4. **Build** - Compilation and Docker builds
5. **Testing & Health Checks** - Workflow testing
6. **Temporal UI & Management** - Open browser UIs
7. **Database & Cleanup** - Database management
8. **Monitoring & Debugging** - Workflow inspection
9. **Documentation** - Docs reference
10. **Utility Commands** - Helpers

## Tips

### Auto-completion
Add to your shell config:

**Bash:**
```bash
# ~/.bashrc
eval "$(task --completion bash)"
```

**Zsh:**
```zsh
# ~/.zshrc
eval "$(task --completion zsh)"
```

**Fish:**
```fish
# ~/.config/fish/config.fish
task --completion fish | source
```

### Aliases
Add to your shell config:

```bash
alias t="task"
alias tup="task up"
alias tdown="task down"
alias tlogs="task logs"
alias thealth="task health"
```

Then use:
```bash
t up
t test:workflow
t logs:temporal-worker
```

## Troubleshooting

### Task command not found
```bash
# Check installation
which task

# If not found, reinstall or add to PATH
export PATH="$HOME/.local/bin:$PATH"
```

### Tasks failing
```bash
# Run with verbose output
task --verbose up

# Or with dry-run to see what would execute
task --dry up
```

### jq command not found
Some tasks use `jq` for JSON formatting:

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Or view without jq
curl http://localhost:3002/health
```

## Resources

- [Task Documentation](https://taskfile.dev/)
- [Task GitHub](https://github.com/go-task/task)
- [Taskfile Schema](https://taskfile.dev/api/)
