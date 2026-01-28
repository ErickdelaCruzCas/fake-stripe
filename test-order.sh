#!/bin/bash

# Test Order Fulfillment Workflow
# Quick helper script para probar diferentes escenarios

API_URL="http://localhost:3002"
TEMPORAL_UI="http://localhost:8080"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Order Fulfillment Workflow Test Script   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if services are running
check_services() {
    echo -e "${YELLOW}Checking services...${NC}"

    if ! curl -s --max-time 5 http://localhost:3002/health > /dev/null; then
        echo -e "${RED}❌ Temporal API not running on port 3002${NC}"
        echo -e "${YELLOW}Run: docker-compose up -d${NC}"
        exit 1
    fi

    if ! curl -s --max-time 5 http://localhost:3001/payment/stats > /dev/null; then
        echo -e "${RED}❌ Fake Stripe not running on port 3001${NC}"
        echo -e "${YELLOW}Run: docker-compose up -d${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All services are running${NC}"
    echo ""
}

# Function to start an order
start_order() {
    local order_id=$1
    local requires_approval=${2:-false}

    echo -e "${BLUE}Starting order: ${order_id}${NC}"

    response=$(curl -s --max-time 10 -X POST ${API_URL}/api/v1/order \
        -H "Content-Type: application/json" \
        -d "{
            \"orderId\": \"${order_id}\",
            \"customerId\": \"CUST-TEST-001\",
            \"items\": [
                {
                    \"sku\": \"ITEM-001\",
                    \"quantity\": 2,
                    \"price\": 29.99
                }
            ],
            \"totalAmount\": 59.98,
            \"shippingAddress\": {
                \"street\": \"123 Main St\",
                \"city\": \"San Francisco\",
                \"state\": \"CA\",
                \"zip\": \"94105\",
                \"country\": \"US\"
            },
            \"customerEmail\": \"test@example.com\",
            \"requiresApproval\": ${requires_approval}
        }")

    if echo "$response" | grep -q "\"success\":true"; then
        echo -e "${GREEN}✅ Order started successfully${NC}"
        workflow_id=$(echo "$response" | grep -o '"workflowId":"[^"]*"' | cut -d'"' -f4)
        echo -e "${BLUE}Workflow ID: ${workflow_id}${NC}"
        echo "$workflow_id"
    else
        echo -e "${RED}❌ Failed to start order${NC}"
        echo "$response"
        exit 1
    fi
}

# Function to get order status
get_status() {
    local workflow_id=$1

    echo -e "\n${YELLOW}Getting order status...${NC}"
    curl -s --max-time 10 ${API_URL}/api/v1/order/${workflow_id}/status | jq '.'
}

# Function to get progress
get_progress() {
    local workflow_id=$1

    progress=$(curl -s --max-time 10 ${API_URL}/api/v1/order/${workflow_id}/progress | jq -r '.progress')
    echo -e "${BLUE}Progress: ${progress}%${NC}"
}

# Function to approve order
approve_order() {
    local workflow_id=$1

    echo -e "\n${GREEN}Approving order...${NC}"
    curl -s --max-time 10 -X POST ${API_URL}/api/v1/order/${workflow_id}/approve | jq '.'
}

# Function to reject order
reject_order() {
    local workflow_id=$1

    echo -e "\n${RED}Rejecting order...${NC}"
    curl -s --max-time 10 -X POST ${API_URL}/api/v1/order/${workflow_id}/reject | jq '.'
}

# Function to cancel order
cancel_order() {
    local workflow_id=$1

    echo -e "\n${YELLOW}Cancelling order...${NC}"
    curl -s --max-time 10 -X POST ${API_URL}/api/v1/order/${workflow_id}/cancel | jq '.'
}

# Menu
show_menu() {
    echo -e "${BLUE}Select a test scenario:${NC}"
    echo "1) Happy Path (auto-approve)"
    echo "2) Manual Approval Flow"
    echo "3) Manager Rejection"
    echo "4) User Cancellation"
    echo "5) Chaos Testing (10 orders)"
    echo "6) Custom Order ID"
    echo "7) Open Temporal UI"
    echo "8) Check Services Status"
    echo "0) Exit"
    echo ""
    read -p "Choose option: " option
}

# Scenario 1: Happy Path
scenario_happy_path() {
    echo -e "\n${GREEN}════ Scenario 1: Happy Path ════${NC}"

    order_id="ORD-HAPPY-$(date +%s)"
    workflow_id=$(start_order $order_id false)

    echo -e "\n${YELLOW}Monitoring progress (30s)...${NC}"
    for i in {1..6}; do
        sleep 5
        get_progress $workflow_id
    done

    get_status $workflow_id

    echo -e "\n${GREEN}View in Temporal UI: ${TEMPORAL_UI}${NC}"
}

# Scenario 2: Manual Approval
scenario_approval() {
    echo -e "\n${GREEN}════ Scenario 2: Manual Approval ════${NC}"

    order_id="ORD-APPROVAL-$(date +%s)"
    workflow_id=$(start_order $order_id true)

    echo -e "\n${YELLOW}Order waiting for approval...${NC}"
    get_status $workflow_id

    read -p "Press ENTER to approve the order..."
    approve_order $workflow_id

    echo -e "\n${YELLOW}Monitoring progress (30s)...${NC}"
    for i in {1..6}; do
        sleep 5
        get_progress $workflow_id
    done

    get_status $workflow_id
}

# Scenario 3: Rejection
scenario_rejection() {
    echo -e "\n${GREEN}════ Scenario 3: Manager Rejection ════${NC}"

    order_id="ORD-REJECT-$(date +%s)"
    workflow_id=$(start_order $order_id true)

    echo -e "\n${YELLOW}Order waiting for approval...${NC}"
    get_status $workflow_id

    read -p "Press ENTER to REJECT the order..."
    reject_order $workflow_id

    sleep 2
    echo -e "\n${YELLOW}Checking compensations...${NC}"
    get_status $workflow_id
}

# Scenario 4: Cancellation
scenario_cancellation() {
    echo -e "\n${GREEN}════ Scenario 4: User Cancellation ════${NC}"

    order_id="ORD-CANCEL-$(date +%s)"
    workflow_id=$(start_order $order_id false)

    echo -e "\n${YELLOW}Waiting 10s for some steps to complete...${NC}"
    sleep 10

    cancel_order $workflow_id

    sleep 3
    echo -e "\n${YELLOW}Checking compensations...${NC}"
    get_status $workflow_id
}

# Scenario 5: Chaos Testing
scenario_chaos() {
    echo -e "\n${GREEN}════ Scenario 5: Chaos Testing (10 orders) ════${NC}"
    echo -e "${YELLOW}This will create 10 orders to see different chaos scenarios${NC}"
    echo -e "${YELLOW}Some orders are EXPECTED to fail (that's the chaos!)${NC}\n"

    local success_count=0
    local failed_count=0

    for i in {1..10}; do
        order_id="ORD-CHAOS-$i-$(date +%s)"
        echo -e "${BLUE}[$i/10] Starting order: ${order_id}${NC}"

        # Don't exit on failure in chaos testing
        response=$(curl -s --max-time 10 -X POST ${API_URL}/api/v1/order \
            -H "Content-Type: application/json" \
            -d "{
                \"orderId\": \"${order_id}\",
                \"customerId\": \"CUST-CHAOS-${i}\",
                \"items\": [
                    {
                        \"sku\": \"ITEM-001\",
                        \"quantity\": 1,
                        \"price\": 29.99
                    }
                ],
                \"totalAmount\": 29.99,
                \"shippingAddress\": {
                    \"street\": \"123 Test St\",
                    \"city\": \"Chicago\",
                    \"state\": \"IL\",
                    \"zip\": \"60601\",
                    \"country\": \"US\"
                },
                \"customerEmail\": \"chaos@example.com\",
                \"requiresApproval\": false
            }")

        if echo "$response" | grep -q "\"success\":true"; then
            echo -e "${GREEN}  ✅ Started successfully${NC}"
            ((success_count++))
        else
            echo -e "${RED}  ❌ Failed to start${NC}"
            echo -e "${YELLOW}  Reason: $(echo "$response" | jq -r '.message // .error // "Unknown error"' 2>/dev/null)${NC}"
            ((failed_count++))
        fi

        sleep 1
    done

    echo -e "\n${GREEN}════ Chaos Testing Summary ════${NC}"
    echo -e "${GREEN}✅ Successfully started: ${success_count}/10${NC}"
    echo -e "${RED}❌ Failed to start: ${failed_count}/10${NC}"
    echo -e "\n${YELLOW}Note: Started workflows may still fail during execution due to chaos scenarios.${NC}"
    echo -e "${YELLOW}View all workflows in Temporal UI: ${TEMPORAL_UI}${NC}"
}

# Scenario 6: Custom Order
scenario_custom() {
    read -p "Enter Order ID: " order_id
    read -p "Requires approval? (true/false): " requires_approval

    workflow_id=$(start_order $order_id $requires_approval)

    echo -e "\n${YELLOW}Workflow started. What do you want to do?${NC}"
    echo "1) Monitor progress"
    echo "2) Approve"
    echo "3) Reject"
    echo "4) Cancel"
    echo "5) Get status"
    read -p "Choose option: " action

    case $action in
        1)
            for i in {1..6}; do
                sleep 5
                get_progress $workflow_id
            done
            ;;
        2) approve_order $workflow_id ;;
        3) reject_order $workflow_id ;;
        4) cancel_order $workflow_id ;;
        5) get_status $workflow_id ;;
    esac
}

# Main
check_services

while true; do
    show_menu

    case $option in
        1) scenario_happy_path ;;
        2) scenario_approval ;;
        3) scenario_rejection ;;
        4) scenario_cancellation ;;
        5) scenario_chaos ;;
        6) scenario_custom ;;
        7)
            echo -e "${GREEN}Opening Temporal UI...${NC}"
            open ${TEMPORAL_UI} 2>/dev/null || xdg-open ${TEMPORAL_UI} 2>/dev/null || echo "Open manually: ${TEMPORAL_UI}"
            ;;
        8) check_services ;;
        0)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac

    echo -e "\n${YELLOW}Press ENTER to continue...${NC}"
    read
    clear
done
