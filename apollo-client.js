import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://tianpeng.stepzen.net/api/quoting-terrier/__graphql",
  headers: {
    Authorization: `ApiKey ${process.env.NEXT_PUBLIC_STEPZEN_KEY}`,
  },
  cache: new InMemoryCache(),
});
export default client
