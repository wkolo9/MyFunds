import type { APIRoute } from 'astro';
import { marketService } from '@/lib/services/market.service';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';
import { 
  createErrorResponseObject, 
  handleServiceError, 
  ErrorCode 
} from '@/lib/utils/error.utils';

export const GET: APIRoute = async (context) => {
  try {
    // 1. Authentication
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return createErrorResponseObject(
        ErrorCode.INVALID_TOKEN,
        'Unauthorized',
        401
      );
    }

    // 2. Service Call
    const statusData = marketService.getStatus();

    // 3. Response
    return new Response(JSON.stringify(statusData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return handleServiceError(error);
  }
};
