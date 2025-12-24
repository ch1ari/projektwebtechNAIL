import React, { useRef } from 'react';
import { clamp } from '../lib/geometry.js';

function normalizeRotation(value) {
  return ((value % 360) + 360) % 360;
}

export default function Sticker({ sticker, placement, boardRef, dispatch, variant, taskId, lockCorrect }) {
  const nodeRef = useRef(null);
  const dragState = useRef(null);

  const baseScale = placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 0.6;
  const rotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
  const isBoardPlacement = Boolean(placement) && variant === 'board';

  function handlePointerDown(event) {
    if (lockCorrect && placement?.isCorrect) return;
    if (!nodeRef.current || !boardRef?.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = event.clientX - centerX;
    const offsetY = event.clientY - centerY;

    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX,
      offsetY
    };

    event.currentTarget.setPointerCapture(event.pointerId);

  }

  function handlePointerMove(event) {
    if (!dragState.current || !boardRef?.current) return;

    const nailEl = document.elementFromPoint(event.clientX, event.clientY)?.closest('.nail');
    if (!nailEl) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const nailRect = nailEl.getBoundingClientRect();
    const targetCenterX = event.clientX - dragState.current.offsetX;
    const targetCenterY = event.clientY - dragState.current.offsetY;
    const xNorm = (targetCenterX - nailRect.left) / nailRect.width;
    const yNorm = (targetCenterY - nailRect.top) / nailRect.height;
    const boardX = (targetCenterX - boardRect.left) / boardRect.width;
    const boardY = (targetCenterY - boardRect.top) / boardRect.height;
    const currentRotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
    const currentScale = placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 1;

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: {
          nailId: nailEl.dataset.nailId,
          x: xNorm,
          y: yNorm,
          boardX,
          boardY,
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

    const nailEl = document.elementFromPoint(event.clientX, event.clientY)?.closest('.nail');
    const nailRect = nailEl?.getBoundingClientRect();
    const distance = Math.hypot(
      event.clientX - dragState.current.startX,
      event.clientY - dragState.current.startY
    );

    if (distance < 6) {
      const basePlacement = placement;
      if (basePlacement) {
        const nextRotation = normalizeRotation((basePlacement.rotation ?? 0) + 15);
        dispatch({
          type: 'placeSticker',
          payload: {
            stickerId: sticker.id,
            position: { ...basePlacement, rotation: nextRotation }
          }
        });
        if (taskId) {
          dispatch({ type: 'finalizePlacement', payload: { stickerId: sticker.id, taskId } });
        }
      }
      dragState.current = null;
      return;
    }

    if (!nailRect || !nailEl) {
      dispatch({ type: 'removeSticker', payload: sticker.id });
      dragState.current = null;
      return;
    }

    const targetCenterX = event.clientX - dragState.current.offsetX;
    const targetCenterY = event.clientY - dragState.current.offsetY;
    const xNorm = (targetCenterX - nailRect.left) / nailRect.width;
    const yNorm = (targetCenterY - nailRect.top) / nailRect.height;
    const boardRect = boardRef.current.getBoundingClientRect();
    const boardX = (targetCenterX - boardRect.left) / boardRect.width;
    const boardY = (targetCenterY - boardRect.top) / boardRect.height;
    const outside =
      event.clientX < nailRect.left ||
      event.clientX > nailRect.right ||
      event.clientY < nailRect.top ||
      event.clientY > nailRect.bottom;

    if (outside) {
      dispatch({ type: 'removeSticker', payload: sticker.id });
      dragState.current = null;
      return;
    }

    const currentRotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
    const currentScale = placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 1;
    const rect = nodeRef.current.getBoundingClientRect();
    const marginX = (rect.width / nailRect.width) / 2;
    const marginY = (rect.height / nailRect.height) / 2;

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: {
          nailId: nailEl.dataset.nailId,
          x: clamp(xNorm, marginX, 1 - marginX),
          y: clamp(yNorm, marginY, 1 - marginY),
          boardX: clamp(boardX, 0, 1),
          boardY: clamp(boardY, 0, 1),
          rotation: currentRotation,
          scale: currentScale
        }
      }
    });

    if (taskId) {
      dispatch({ type: 'finalizePlacement', payload: { stickerId: sticker.id, taskId } });
    }

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
      <img src={sticker.img ?? sticker.src} alt={sticker.name} draggable="false" />
    </div>
  );
}
