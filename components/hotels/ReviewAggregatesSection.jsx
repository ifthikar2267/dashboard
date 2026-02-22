'use client';

import { useCallback } from 'react';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';

function safeArray(val) {
  return Array.isArray(val) ? [...val] : [];
}

function emptyReview() {
  return {
    average_rating: '',
    total_reviews: '',
  };
}

function normalizeReview(r) {
  return {
    ...emptyReview(),
    ...(r && typeof r === 'object' ? r : {}),
  };
}

export default function ReviewAggregatesSection({ reviews = [], onChange }) {
  const list = safeArray(reviews).map(normalizeReview);

  const update = useCallback(
    (next) => {
      if (typeof onChange === 'function') {
        onChange(safeArray(next));
      }
    },
    [onChange]
  );

  const addReview = useCallback(() => {
    update([...list, emptyReview()]);
  }, [list, update]);

  const removeReview = useCallback(
    (idx) => {
      if (idx < 0 || idx >= list.length) return;
      update(list.filter((_, i) => i !== idx));
    },
    [list, update]
  );

  const setReviewField = useCallback(
    (idx, field, value) => {
      if (idx < 0 || idx >= list.length) return;
      const next = list.map((r, i) =>
        i === idx ? { ...emptyReview(), ...r, [field]: value } : r
      );
      update(next);
    },
    [list, update]
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Typography variant="subtitle2" color="text.secondary">
          {list.length} review aggregate{list.length !== 1 ? 's' : ''}
        </Typography>

        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={addReview}
        >
          Add review
        </Button>
      </div>

      {list.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Add review aggregate with average rating and total review count.
        </Typography>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((review, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr auto',
                },
                gap: 2,
                alignItems: 'center',
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'grey.50',
                width: '100%',
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="Average rating (0–10)"
                type="number"
                inputProps={{ min: 0, max: 10, step: 0.1 }}
                value={review.average_rating}
                onChange={(e) =>
                  setReviewField(idx, 'average_rating', e.target.value)
                }
                onWheel={(e) => e.target.blur()}
                onKeyDown={(e) =>
                  ['ArrowUp', 'ArrowDown'].includes(e.key) &&
                  e.preventDefault()
                }
              />

              <TextField
                fullWidth
                size="small"
                label="Total reviews"
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={review.total_reviews}
                onChange={(e) =>
                  setReviewField(idx, 'total_reviews', e.target.value)
                }
                onWheel={(e) => e.target.blur()}
                onKeyDown={(e) =>
                  ['ArrowUp', 'ArrowDown'].includes(e.key) &&
                  e.preventDefault()
                }
              />

              <IconButton
                type="button"
                color="error"
                size="small"
                onClick={() => removeReview(idx)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </div>
      )}
    </div>
  );
}