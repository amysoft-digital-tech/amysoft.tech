#!/bin/bash
# gather-issue-context.sh - Automated context gathering for GitHub issues
# This script helps developers quickly find relevant documentation and guidelines for a given issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if issue number is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide an issue number${NC}"
    echo "Usage: $0 <issue-number>"
    exit 1
fi

ISSUE_NUMBER=$1

echo -e "${BLUE}=== Gathering Context for Issue #${ISSUE_NUMBER} ===${NC}\n"

# Fetch issue details
echo -e "${YELLOW}Fetching issue details...${NC}"
ISSUE_DATA=$(gh issue view $ISSUE_NUMBER --json number,title,body,labels,assignees,url)

# Extract issue information
ISSUE_TITLE=$(echo $ISSUE_DATA | jq -r '.title')
ISSUE_BODY=$(echo $ISSUE_DATA | jq -r '.body')
ISSUE_LABELS=$(echo $ISSUE_DATA | jq -r '.labels[].name' | tr '\n' ', ')
ISSUE_URL=$(echo $ISSUE_DATA | jq -r '.url')

echo -e "${GREEN}Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}${NC}"
echo -e "Labels: ${ISSUE_LABELS}"
echo -e "URL: ${ISSUE_URL}\n"

# Extract keywords from issue title and body
echo -e "${YELLOW}Extracting keywords...${NC}"
KEYWORDS=$(echo "$ISSUE_TITLE $ISSUE_BODY" | tr '[:upper:]' '[:lower:]' | grep -oE '\b[a-z]{4,}\b' | sort -u | head -20)
echo -e "Keywords found: $(echo $KEYWORDS | tr '\n' ' ')\n"

# Function to search documentation
search_docs() {
    local dir=$1
    local desc=$2
    
    echo -e "${YELLOW}=== ${desc} ===${NC}"
    
    for keyword in $KEYWORDS; do
        # Skip common words
        if [[ "$keyword" =~ ^(that|this|with|from|have|been|will|should|would|could)$ ]]; then
            continue
        fi
        
        # Search for files containing the keyword
        matches=$(find "$dir" -name "*.md" -o -name "*.ts" -o -name "*.js" 2>/dev/null | xargs grep -l -i "$keyword" 2>/dev/null || true)
        
        if [ ! -z "$matches" ]; then
            echo -e "${GREEN}Found matches for '${keyword}':${NC}"
            echo "$matches" | sed 's/^/  - /'
        fi
    done
    echo ""
}

# Search different documentation areas
if [ -d "docs" ]; then
    search_docs "docs/project-requirements" "Project Requirements and PRDs"
    search_docs "docs/specifications" "API and Component Specifications"
    search_docs "docs/architecture" "Architecture Documentation"
    search_docs "docs/design" "Design System and Guidelines"
    search_docs "docs/content" "Content Strategy"
fi

# Search for related code patterns
echo -e "${YELLOW}=== Related Code Patterns ===${NC}"

# Look for component mentions
if [[ "$ISSUE_TITLE" =~ component|widget|ui ]]; then
    echo -e "${GREEN}Searching for UI components:${NC}"
    find libs/shared/ui-components -name "*.component.ts" 2>/dev/null | head -10 | sed 's/^/  - /' || echo "  No component library found"
fi

# Look for API mentions
if [[ "$ISSUE_TITLE" =~ api|endpoint|service ]]; then
    echo -e "${GREEN}Searching for API services:${NC}"
    find apps/api/src -name "*.service.ts" -o -name "*.controller.ts" 2>/dev/null | head -10 | sed 's/^/  - /' || echo "  No API services found"
fi

# Look for PWA mentions
if [[ "$ISSUE_TITLE" =~ pwa|mobile|ionic ]]; then
    echo -e "${GREEN}Searching for PWA components:${NC}"
    find apps/pwa/src -name "*.ts" -o -name "*.html" 2>/dev/null | head -10 | sed 's/^/  - /' || echo "  No PWA files found"
fi

echo ""

# Suggest next steps
echo -e "${BLUE}=== Suggested Next Steps ===${NC}"
echo "1. Review the found documentation files for requirements and guidelines"
echo "2. Check existing implementations for patterns to follow"
echo "3. Look for related test files to understand expected behavior"
echo "4. Consider the design system guidelines when implementing UI changes"
echo "5. Ensure API changes follow the established specifications"

# Check for related issues
echo -e "\n${YELLOW}Checking for related issues...${NC}"
RELATED_ISSUES=$(gh issue list --state all --limit 10 --json number,title | jq -r '.[] | select(.title | ascii_downcase | contains("'$(echo $ISSUE_TITLE | tr '[:upper:]' '[:lower:]' | cut -d' ' -f1)'")) | "  #\(.number): \(.title)"' | head -5)

if [ ! -z "$RELATED_ISSUES" ]; then
    echo -e "${GREEN}Potentially related issues:${NC}"
    echo "$RELATED_ISSUES"
else
    echo "No related issues found"
fi

echo -e "\n${GREEN}Context gathering complete!${NC}"