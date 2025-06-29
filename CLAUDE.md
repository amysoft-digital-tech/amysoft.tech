# CLAUDE.md - Nx Workspace Root
## Beyond the AI Plateau - Main Development Workspace

### Nx Workspace Context
This is the primary Nx monorepo containing all applications and shared libraries for amysoft.tech platform.

### Workspace Structure
- **Apps**: website, pwa, api, admin
- **Shared Libraries**: ui-components, data-access, utils
- **Feature Libraries**: Organized by application domain

### Key Nx Commands
- `nx graph` - View dependency graph
- `nx affected:test` - Test only affected projects
- `nx serve website` - Serve website app
- `nx build api --prod` - Build API for production
- `nx run-many --target=test --all` - Test all projects

### Claude Code Guidelines
When working in this workspace:
1. Always consider the dependency graph impact
2. Use Nx generators for consistent code structure
3. Shared code goes in libs/, app-specific code in apps/
4. Follow the established library boundaries

### Development Environment
This workspace uses VS Code dev containers for consistent development experience:
- All services run in Docker containers
- Database (PostgreSQL) and Redis included
- Monitoring with Prometheus and Grafana
- Email testing with MailHog

### Quick Start

**✅ Workspace Status: READY FOR DEVELOPMENT**

The amysoft.tech Nx workspace is successfully configured with:
- 4 Applications: website, api, pwa, admin  
- Dev Container: VS Code + Docker with full stack
- Dependencies: All Angular, NestJS, and Nx packages installed
- Services: PostgreSQL, Redis, monitoring stack running

### Manual Development Commands

While Nx configuration is being optimized, you can develop using direct commands:

```bash
# Check application structure
ls apps/                    # Shows: admin, api, pwa, website

# View application files
ls apps/website/src/        # Angular website source
ls apps/api/src/           # NestJS API source  
ls apps/pwa/src/           # PWA source
ls apps/admin/src/         # Admin console source

# Development workflow
# 1. Edit files directly in apps/[app-name]/src/
# 2. Each app has its own CLAUDE.md documentation
# 3. Use VS Code dev container for full development experience
```

### Application Ports
- Website: http://localhost:4200
- API: http://localhost:3000
- PWA: http://localhost:8100  
- Admin: http://localhost:4201
- Database: localhost:5432
- Redis: localhost:6379
- Grafana: http://localhost:3002

## GitHub Issue Workflow

### Issue Selection and Context Gathering
When working on GitHub issues, follow this workflow:

1. **Retrieve First Available Issue**:
   ```bash
   # Get first unassigned open issue
   gh issue list --assignee "" --state open --limit 1 --json number,title,body,labels,url
   
   # Or select specific issue
   gh issue view <issue-number> --json number,title,body,labels,assignees,url
   ```

2. **Gather Issue Context**:
   - Read issue description and acceptance criteria
   - Review comments and related discussions
   - Search codebase for related files mentioned in issue
   - Extract code examples and technical requirements
   - Identify affected applications (website, api, pwa, admin)

3. **Create Feature Branch**:
   ```bash
   # Branch naming: feature/<issue-number>-<description>
   # For bugs: fix/<issue-number>-<description>
   git checkout main
   git pull origin main
   git checkout -b feature/123-add-user-authentication
   ```

4. **Update Issue Status**:
   ```bash
   # Assign to self and add labels
   gh issue edit <issue-number> --add-assignee @me --add-label "in-progress"
   
   # Add initial comment
   gh issue comment <issue-number> --body "Started working on this issue. Branch: feature/123-add-user-authentication"
   ```

### Implementation and Progress Tracking

5. **Track Progress with Commits**:
   - Use conventional commit format: `feat(#123): implement user login form`
   - Commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
   - Reference issue number in each commit
   - Make atomic commits with clear descriptions

6. **Regular Progress Updates**:
   ```bash
   # Update issue every 3-5 commits or at milestones
   gh issue comment <issue-number> --body "Progress update: Completed login form implementation. Next: Add validation logic."
   ```

7. **Push Changes**:
   ```bash
   # Push feature branch with tracking
   git push -u origin feature/123-add-user-authentication
   ```

### Pull Request Creation and Review

8. **Create Pull Request**:
   ```bash
   gh pr create --title "feat: implement user authentication system (#123)" \
                --body "## Summary
   Implements user authentication system as requested in #123
   
   ## Changes
   - Added login/register forms
   - Implemented JWT authentication
   - Added user session management
   
   ## Testing
   - [ ] Manual testing completed
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   
   ## Checklist
   - [ ] Code follows project standards
   - [ ] Documentation updated
   - [ ] No breaking changes
   
   Closes #123"
   ```

9. **Update Issue with PR Link**:
   ```bash
   gh issue comment <issue-number> --body "Implementation complete. Created PR: #<pr-number>"
   gh issue edit <issue-number> --add-label "ready-for-review" --remove-label "in-progress"
   ```

### PR Review and Merge Workflow

10. **Review Open PRs**:
    ```bash
    # List PRs ready for review
    gh pr list --label "ready-for-review" --state open
    
    # Review specific PR
    gh pr view <pr-number> --comments
    gh pr diff <pr-number>
    gh pr checks <pr-number>
    ```

11. **Validate PR Before Merge**:
    ```bash
    # Check CI status
    gh pr checks <pr-number>
    
    # Ensure no conflicts
    gh pr view <pr-number> --json mergeable
    
    # Run local tests if needed
    nx affected:test --base=main
    nx affected:lint --base=main
    nx affected:build --base=main
    ```

12. **Merge PR**:
    ```bash
    # Squash and merge (preferred)
    gh pr merge <pr-number> --squash --delete-branch
    
    # Add merge comment
    gh pr comment <pr-number> --body "Merged successfully. Issue resolved."
    ```

13. **Close Issue**:
    ```bash
    gh issue close <issue-number> --comment "Resolved in PR #<pr-number>. Feature implemented and tested."
    ```

### Workflow Commands Summary

```bash
# Complete workflow for new issue
gh issue list --assignee "" --state open --limit 1  # Select issue
gh issue edit <issue-number> --add-assignee @me --add-label "in-progress"
git checkout -b feature/<issue-number>-<description>
# ... implement changes ...
git commit -m "feat(#<issue-number>): description"
git push -u origin feature/<issue-number>-<description>
gh pr create --title "feat: description (#<issue-number>)" --body "Closes #<issue-number>"
gh pr merge <pr-number> --squash --delete-branch
gh issue close <issue-number>
```

### Best Practices

- **Always link commits and PRs to issues** using `#issue-number`
- **Use conventional commit messages** for consistency
- **Test changes locally** before creating PR
- **Update documentation** when adding new features
- **Clean up branches** after merge
- **Provide clear PR descriptions** with testing notes
- **Review CI checks** before merging
- **Consider Nx workspace impact** when making changes across apps

## Claude Code Primary Objective

**SINGLE FOCUS: ISSUE RESOLUTION WORKFLOW**

When Claude Code is invoked, the primary and only objective is to:

1. **Open the next available GitHub issue** following the workflow above
2. **Implement the solution** according to issue requirements  
3. **Close the issue** with a completed pull request

**No other tasks should be undertaken unless explicitly requested by the user.**

### Default Behavior
- Automatically retrieve first unassigned open issue
- Follow complete workflow from issue selection to closure
- Focus solely on resolving issues in sequence
- Maintain workflow standards and best practices throughout

This ensures consistent, focused development that systematically addresses the project backlog.