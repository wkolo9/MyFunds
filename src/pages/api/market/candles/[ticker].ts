import type { APIRoute } from 'astro';
import { marketService } from '@/lib/services/market.service';
import { getAuthenticatedUser } from '@/lib/utils/auth.utils';
import { 
  createErrorResponseObject, 
  handleServiceError, 
  ErrorCode 
} from '@/lib/utils/error.utils';
import { tickerParamSchema } from '@/lib/validation/market.validation';

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

    // 2. Input Validation
    const { ticker } = context.params;
    
    const validationResult = tickerParamSchema.safeParse({ ticker });
    
    if (!validationResult.success) {
      return createErrorResponseObject(
        ErrorCode.VALIDATION_ERROR,
        'Invalid ticker format',
        400,
        'ticker'
      );
    }

    const validTicker = validationResult.data.ticker;

    // 3. Service Call
    const candlesData = await marketService.getCandles(validTicker);

    // 4. Response
    return new Response(JSON.stringify(candlesData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return handleServiceError(error);
  }
};

