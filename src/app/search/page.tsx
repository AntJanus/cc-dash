import { Suspense } from "react";
import { SearchPage } from "@/components/search/search-page";

export default function SearchRoute() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
