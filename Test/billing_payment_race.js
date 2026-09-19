import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

export const options = {
    vus: 10,
    iterations: 10,

    thresholds: {
        payment_success: ['count==1'],
        payment_conflict: ['count==9'],
        payment_unexpected: ['count==0'],
    },
};

const BASE_URL = 'http://localhost:8080';

const KITCHEN_TOKEN = __ENV.KITCHEN_TOKEN;
const WAITER_TOKEN = __ENV.WAITER_TOKEN;
const CASHIER_TOKEN = __ENV.CASHIER_TOKEN;

const QR_TOKEN =
    '273fd540-a88e-41ab-aef5-239662231112';


// =====================================================
// CUSTOM METRICS
// =====================================================

const paymentSuccess =
    new Counter('payment_success');

const paymentConflict =
    new Counter('payment_conflict');

const paymentUnexpected =
    new Counter('payment_unexpected');


// =====================================================
// SETUP
// =====================================================

export function setup() {

    console.log(
        'Creating ONE fresh order for payment race test...'
    );

    // =================================================
    // 1. CREATE ORDER
    // =================================================

    const orderPayload = JSON.stringify({
        qrToken: QR_TOKEN,
        items: [
            {
                menuItemId: 2,
                quantity: 2,
            },
        ],
    });

    const orderResponse = http.post(
        `${BASE_URL}/api/orders`,
        orderPayload,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    const orderCreated = check(orderResponse, {
        'order created': (r) =>
            r.status === 201,
    });

    if (!orderCreated) {

        console.log(
            `ORDER FAILED | ${orderResponse.status} | ${orderResponse.body}`
        );

        throw new Error(
            'Could not create test order'
        );
    }

    const orderId =
        orderResponse.json('id');

    console.log(
        `ORDER CREATED | T02 | Order ID ${orderId}`
    );


    // =================================================
    // 2. KITCHEN → CONFIRMED
    // =================================================

    const confirmed = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=CONFIRMED`,
        null,
        {
            headers: {
                Authorization:
                    `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    if (!check(confirmed, {
        'kitchen confirmed': (r) =>
            r.status === 200,
    })) {

        throw new Error(
            `Kitchen CONFIRMED failed: ${confirmed.status} ${confirmed.body}`
        );
    }


    // =================================================
    // 3. KITCHEN → PREPARING
    // =================================================

    const preparing = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=PREPARING`,
        null,
        {
            headers: {
                Authorization:
                    `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    if (!check(preparing, {
        'kitchen preparing': (r) =>
            r.status === 200,
    })) {

        throw new Error(
            `Kitchen PREPARING failed: ${preparing.status} ${preparing.body}`
        );
    }


    // =================================================
    // 4. KITCHEN → READY
    // =================================================

    const ready = http.patch(
        `${BASE_URL}/api/kitchen/orders/${orderId}/status?status=READY`,
        null,
        {
            headers: {
                Authorization:
                    `Bearer ${KITCHEN_TOKEN}`,
            },
        }
    );

    if (!check(ready, {
        'kitchen ready': (r) =>
            r.status === 200,
    })) {

        throw new Error(
            `Kitchen READY failed: ${ready.status} ${ready.body}`
        );
    }


    // =================================================
    // 5. WAITER → SERVED
    // =================================================

    const served = http.patch(
        `${BASE_URL}/api/waiter/orders/${orderId}/status?status=SERVED`,
        null,
        {
            headers: {
                Authorization:
                    `Bearer ${WAITER_TOKEN}`,
            },
        }
    );

    if (!check(served, {
        'waiter served': (r) =>
            r.status === 200,
    })) {

        throw new Error(
            `Waiter SERVED failed: ${served.status} ${served.body}`
        );
    }


    // =================================================
    // 6. GENERATE BILL
    // =================================================

    const billResponse = http.post(
        `${BASE_URL}/api/cashier/bills/order/${orderId}`,
        null,
        {
            headers: {
                Authorization:
                    `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );

    if (!check(billResponse, {
        'bill generated': (r) =>
            r.status === 200,
    })) {

        console.log(
            `BILL FAILED | Order ${orderId} | ` +
            `${billResponse.status} | ${billResponse.body}`
        );

        throw new Error(
            'Could not create test bill'
        );
    }

    const billId =
        billResponse.json('id');

    console.log(
        `TEST BILL CREATED | Order ${orderId} | Bill ID ${billId}`
    );

    return {
        billId: billId,
    };
}


// =====================================================
// PAYMENT RACE
// =====================================================

export default function (data) {

    const billId =
        data.billId;

    console.log(
        `VU ${__VU} attempting payment on BILL ${billId}`
    );

    const paid = http.patch(
        `${BASE_URL}/api/cashier/bills/${billId}/paid`,
        null,
        {
            headers: {
                Authorization:
                    `Bearer ${CASHIER_TOKEN}`,
            },
        }
    );


    // =================================================
    // COUNT RESULT
    // =================================================

    if (paid.status === 200) {

        paymentSuccess.add(1);

        console.log(
            `PAYMENT SUCCESS | VU ${__VU} | BILL ${billId}`
        );

    } else if (paid.status === 409) {

        paymentConflict.add(1);

        console.log(
            `PAYMENT REJECTED CORRECTLY | VU ${__VU} | BILL ${billId}`
        );

    } else {

        paymentUnexpected.add(1);

        console.log(
            `UNEXPECTED RESPONSE | ` +
            `VU ${__VU} | ` +
            `Bill ${billId} | ` +
            `Status ${paid.status} | ` +
            `${paid.body}`
        );
    }


    // =================================================
    // BASIC RESPONSE CHECK
    // =================================================

    check(paid, {
        'payment response is 200 or 409':
            (r) =>
                r.status === 200 ||
                r.status === 409,
    });
}