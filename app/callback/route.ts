import { handleAuth } from "@workos-inc/authkit-nextjs";

/** WorkOS redirect URI. Set `NEXT_PUBLIC_WORKOS_REDIRECT_URI` to this path. */
export const GET = handleAuth({ returnPathname: "/" });
