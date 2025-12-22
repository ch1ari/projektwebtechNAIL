import React, { useRef } from 'react';
import { clamp } from '../lib/geometry.js';

function normalizeRotation(value) {
  return ((value % 360) + 360) % 360;
}

export default function Sticker({ sticker, placement, boardRef, dispatch, variant }) {
  const nodeRef = useRef(null);
  const dragState = useRef(null);

  const baseScale = placement?.scale ?? sticker.scale ?? 1;
  const rotation = placement?.rotation ?? 0;
  const isBoardPlacement = Boolean(placement) && variant === 'board';

  function handlePointerDown(event) {
    if (!nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = event.clientX - centerX;
    const offsetY = event.clientY - centerY;

    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX,
      offsetY,
      originPlacement: placement ? { ...placement } : null
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    if (!placement && boardRef?.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const targetCenterX = event.clientX - offsetX;
      const targetCenterY = event.clientY - offsetY;
      const xNorm = (targetCenterX - boardRect.left) / boardRect.width;
      const yNorm = (targetCenterY - boardRect.top) / boardRect.height;

      dispatch({
        type: 'placeSticker',
        payload: {
          stickerId: sticker.id,
          position: {
            x: xNorm,
            y: yNorm,
            rotation: 0,
            scale: sticker.scale ?? 1
          }
        }
      });
    }
  }

  function handlePointerMove(event) {
    if (!dragState.current || !boardRef?.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const targetCenterX = event.clientX - dragState.current.offsetX;
    const targetCenterY = event.clientY - dragState.current.offsetY;
    const xNorm = (targetCenterX - boardRect.left) / boardRect.width;
    const yNorm = (targetCenterY - boardRect.top) / boardRect.height;
    const currentRotation = placement?.rotation ?? dragState.current.originPlacement?.rotation ?? 0;
    const currentScale = placement?.scale ?? dragState.current.originPlacement?.scale ?? sticker.scale ?? 1;

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: {
          x: xNorm,
          y: yNorm,
          rotation: currentRotation,
          scale: currentScale
        }
      }
    });
  }

  function handlePointerUp(event) {
    if (!dragState.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const distance = Math.hypot(
      event.clientX - dragState.current.startX,
      event.clientY - dragState.current.startY
    );

    const boardRect = boardRef?.current?.getBoundingClientRect();

    if (distance < 6) {
      const basePlacement = dragState.current.originPlacement || placement;
      if (basePlacement) {
        const nextRotation = normalizeRotation((basePlacement.rotation ?? 0) + 15);
        const currentScale = basePlacement.scale ?? sticker.scale ?? 1;
        dispatch({
          type: 'placeSticker',
          payload: {
            stickerId: sticker.id,
            position: { ...basePlacement, rotation: nextRotation, scale: currentScale }
          }
        });
      }
      dragState.current = null;
      return;
    }

    if (!boardRect) {
      dragState.current = null;
      return;
    }

    const targetCenterX = event.clientX - dragState.current.offsetX;
    const targetCenterY = event.clientY - dragState.current.offsetY;
    const xNorm = (targetCenterX - boardRect.left) / boardRect.width;
    const yNorm = (targetCenterY - boardRect.top) / boardRect.height;

    const outside =
      event.clientX < boardRect.left ||
      event.clientX > boardRect.right ||
      event.clientY < boardRect.top ||
      event.clientY > boardRect.bottom;

    if (outside) {
      dispatch({ type: 'removeSticker', payload: sticker.id });
      dragState.current = null;
      return;
    }

    const currentRotation = placement?.rotation ?? dragState.current.originPlacement?.rotation ?? 0;
    const currentScale = placement?.scale ?? dragState.current.originPlacement?.scale ?? sticker.scale ?? 1;

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: {
          x: clamp(xNorm, 0, 1),
          y: clamp(yNorm, 0, 1),
          rotation: currentRotation,
          scale: currentScale
        }
      }
    });

    dragState.current = null;
  }

  function handlePointerCancel() {
    dragState.current = null;
  }

  const style = isBoardPlacement
    ? {
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${baseScale})`
      }
    : {
        transform: `rotate(${rotation}deg) scale(${baseScale})`
      };

  return (
    <div
      ref={nodeRef}
      className={`sticker ${isBoardPlacement ? 'is-placed' : 'is-palette'} ${variant === 'palette' ? 'from-palette' : ''}`}
      style={style}
      role="img"
      aria-label={sticker.name}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <img src={sticker.src} alt={sticker.name} draggable="false" />
    </div>
  );
}
