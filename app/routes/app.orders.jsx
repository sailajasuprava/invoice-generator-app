import { useLoaderData } from "react-router";
import { Page, Card, IndexTable, Text, Box } from "@shopify/polaris";
import { authenticate } from "../shopify.server"; // adjust path if needed

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query GetOrders {
      orders(first: 20, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            email
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `);

  const body = await response.json();
  const orders = body.data?.orders?.edges ?? [];

  return Response.json({ orders });
}

export default function OrdersPage() {
  const { orders } = useLoaderData();

  return (
    <Page title="Orders">
      {orders.length === 0 ? (
        <Box padding="400">
          <Text as="p" variant="bodyMd">
            No orders found. Create a test order in your store to see it here.
          </Text>
        </Box>
      ) : (
        <Card>
          <IndexTable
            resourceName={{ singular: "order", plural: "orders" }}
            itemCount={orders.length}
            headings={[
              { title: "Order" },
              { title: "Date" },
              { title: "Customer email" },
              { title: "Financial status" },
              { title: "Fulfillment" },
              { title: "Total" },
            ]}
          >
            {orders.map((edge, index) => {
              const o = edge.node;
              const total = o.totalPriceSet.shopMoney;

              return (
                <IndexTable.Row id={o.id} key={o.id} position={index}>
                  <IndexTable.Cell>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {o.name}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {new Date(o.createdAt).toLocaleString()}
                  </IndexTable.Cell>
                  <IndexTable.Cell>{o.email || "-"}</IndexTable.Cell>
                  <IndexTable.Cell>{o.displayFinancialStatus}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {o.displayFulfillmentStatus}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {total.currencyCode} {Number(total.amount).toFixed(2)}
                  </IndexTable.Cell>
                </IndexTable.Row>
              );
            })}
          </IndexTable>
        </Card>
      )}
    </Page>
  );
}
