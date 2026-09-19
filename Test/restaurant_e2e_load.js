import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// =====================================================
// CONFIG
// =====================================================

const BASE_URL = 'http://localhost:8080';

const KITCHEN_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJLSVQtMDAxIiwicm9sZSI6IktJVENIRU4iLCJjcmVkZW50aWFsc1ZlcnNpb24iOjAsImlhdCI6MTc4OTM4ODIyMywiZXhwIjoxNzg5NDc0NjIzfQ.11nbbdRQLecLGfskprvQTvhJQzLarU2KQdg8fYFPyTaDYsMNN1EEcJm6bivtOsMM';

const WAITER_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJFTVAwMDQiLCJyb2xlIjoiV0FJVEVSIiwiY3JlZGVudGlhbHNWZXJzaW9uIjowLCJpYXQiOjE3ODkzODgyNzksImV4cCI6MTc4OTQ3NDY3OX0.8Ld1pO1VM7URT9SaF_lKbDjH0JvQwxXXasLfB2aV9eKOS7N6gD-y3e8IbK30IfOo';

const CASHIER_TOKEN = 'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJDQVNILTAwMSIsInJvbGUiOiJDQVNISUVSIiwiY3JlZGVudGlhbHNWZXJzaW9uIjowLCJpYXQiOjE3ODkzODgxNTMsImV4cCI6MTc4OTQ3NDU1M30.8rZWZOsPpHJZpD1zqDANjH_SbifqSNZaw9dv7xBBjUg0ROfphC1B8Y3BW8TEz1QO';

// =====================================================
// TABLES
// =====================================================

const TABLES = [
    {
        name: 'T01',
        qrToken: 'e2adf520-e681-4c94-a7de-370c7827a8d6'
    },
    {
        name: 'T02',
        qrToken: '273fd540-a88e-41ab-aef5-239662231112'
    },
    {
        name: 'T03',
        qrToken: 'b9408165-5b3c-4103-99f0-6805e670b6d4'
    },
    {
        name: 'T04',
        qrToken: '965e9649-9269-4d88-ba60-1df14845ce20'
    },
    {
        name: 'T05',
        qrToken: '25a02c14-2dc7-4872-83fa-65efac2c166a'
    },
    {
        name: 'T06',
        qrToken: 'efba6696-b0ff-4b16-a30d-b8680bebc052'
    }
];

// =====================================================
// TEST CONFIGURATION
// =====================================================
//
// IMPORTANT:
// 6 VUs = 6 tables = 1 customer flow per table.
//
// We intentionally do NOT use 25/50/100/200 VUs here.
// =====================================================

export const options = {
    vus: 6,
    duration: '2m',

    thresholds: {
        checks: ['rate>0.99'],
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<1500']
    }
};

// =====================================================
// METRICS
// =====================================================

const ordersCreated = new Counter('orders_created');
const ordersServed = new Counter('orders_served');
const billsCreated = new Counter('bills_created');
const paymentsCompleted = new Counter('payments_completed');

// =====================================================
// HELPERS
// =====================================================

function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Each VU permanently owns one table.
//
// VU 1 → T01
// VU 2 → T02
// VU 3 → T03
// VU 4 → T04
// VU 5 → T05
// VU 6 → T06
//
function getTableForVU() {
    return TABLES[(__VU - 1) % TABLES.length];
}

// =====================================================
// MAIN TEST
// =====================================================

export default function () {

    const table = getTableForVU();

    console.log(
        `VU ${__VU} using ${table.name}`
    );

    // =================================================
    // 1. VERIFY QR CODE
    // =================================================

    const qrResponse = http.get(
        `${BASE_URL}/api/table/verify/${table.qrToken}`
    );

    const qrSuccess = check(qrResponse, {
        'QR verified': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!qrSuccess) {
        console.error(
            `QR FAILED | table=${table.name} | status=${qrResponse.status} | body=${qrResponse.body}`
        );
        return;
    }

    // =================================================
    // 2. CREATE ORDER
    // =================================================
    //
    // IMPORTANT:
    // DO NOT send sessionCode here.
    //
    // When there is no active customer session,
    // OrderService creates a fresh session.
    //
    // After payment the session is closed, so the next
    // iteration can create another fresh session.
    // =================================================

    const orderPayload = JSON.stringify({
        qrToken: table.qrToken,
        items: [
            {
                menuItemId: 2,
                quantity: 1
            }
        ]
    });

    const orderResponse = http.post(
        `${BASE_URL}/api/orders`,
        orderPayload,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    const orderSuccess = check(orderResponse, {
        'order created': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!orderSuccess) {
        console.error(
            `ORDER FAILED | table=${table.name} | status=${orderResponse.status} | body=${orderResponse.body}`
        );
        return;
    }

    ordersCreated.add(1);

    let order;

    try {
        order = JSON.parse(orderResponse.body);
    } catch (e) {
        console.error(
            `INVALID ORDER RESPONSE | table=${table.name} | body=${orderResponse.body}`
        );
        return;
    }

    const orderId = order.id;

    if (!orderId) {
        console.error(
            `ORDER ID MISSING | table=${table.name}`
        );
        return;
    }

    sleep(0.1);

    // =================================================
    // 3. KITCHEN → CONFIRMED
    // =================================================

    const confirmedResponse = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=CONFIRMED`,
        null,
        {
            headers: authHeaders(KITCHEN_TOKEN)
        }
    );

    const confirmedSuccess = check(confirmedResponse, {
        'kitchen confirmed': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!confirmedSuccess) {
        console.error(
            `CONFIRMED FAILED | order=${orderId} | table=${table.name} | status=${confirmedResponse.status} | body=${confirmedResponse.body}`
        );
        return;
    }

    // =================================================
    // 4. KITCHEN → PREPARING
    // =================================================

    const preparingResponse = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=PREPARING`,
        null,
        {
            headers: authHeaders(KITCHEN_TOKEN)
        }
    );

    const preparingSuccess = check(preparingResponse, {
        'kitchen preparing': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!preparingSuccess) {
        console.error(
            `PREPARING FAILED | order=${orderId} | table=${table.name} | status=${preparingResponse.status} | body=${preparingResponse.body}`
        );
        return;
    }

    // =================================================
    // 5. KITCHEN → READY
    // =================================================

    const readyResponse = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=READY`,
        null,
        {
            headers: authHeaders(KITCHEN_TOKEN)
        }
    );

    const readySuccess = check(readyResponse, {
        'kitchen ready': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!readySuccess) {
        console.error(
            `READY FAILED | order=${orderId} | table=${table.name} | status=${readyResponse.status} | body=${readyResponse.body}`
        );
        return;
    }

    // =================================================
    // 6. WAITER → SERVED
    // =================================================

    const servedResponse = http.patch(
        `${BASE_URL}/api/waiter/orders/${orderId}/status?status=SERVED`,
        null,
        {
            headers: authHeaders(WAITER_TOKEN)
        }
    );

    const servedSuccess = check(servedResponse, {
        'waiter served order': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!servedSuccess) {
        console.error(
            `SERVED FAILED | order=${orderId} | table=${table.name} | status=${servedResponse.status} | body=${servedResponse.body}`
        );
        return;
    }

    ordersServed.add(1);

    // =================================================
    // 7. CREATE BILL
    // =================================================

    const billResponse = http.post(
        `${BASE_URL}/api/cashier/bills/order/${orderId}`,
        null,
        {
            headers: authHeaders(CASHIER_TOKEN)
        }
    );

    const billSuccess = check(billResponse, {
        'bill created': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!billSuccess) {
        console.error(
            `BILL FAILED | order=${orderId} | table=${table.name} | status=${billResponse.status} | body=${billResponse.body}`
        );
        return;
    }

    billsCreated.add(1);

    let bill;

    try {
        bill = JSON.parse(billResponse.body);
    } catch (e) {
        console.error(
            `INVALID BILL RESPONSE | order=${orderId} | body=${billResponse.body}`
        );
        return;
    }

    const billId = bill.id;

    if (!billId) {
        console.error(
            `BILL ID MISSING | order=${orderId}`
        );
        return;
    }

    // =================================================
    // 8. PAYMENT
    // =================================================

    const paymentResponse = http.patch(
        `${BASE_URL}/api/cashier/bills/${billId}/paid`,
        null,
        {
            headers: authHeaders(CASHIER_TOKEN)
        }
    );

    const paymentSuccess = check(paymentResponse, {
        'payment successful': (r) =>
            r.status >= 200 && r.status < 300
    });

    if (!paymentSuccess) {
        console.error(
            `PAYMENT FAILED | bill=${billId} | table=${table.name} | status=${paymentResponse.status} | body=${paymentResponse.body}`
        );
        return;
    }

    paymentsCompleted.add(1);

    console.log(
        `E2E SUCCESS | VU=${__VU} | table=${table.name} | order=${orderId} | bill=${billId}`
    );

    // Small pause before this VU starts a new customer session.
    sleep(0.5);
}