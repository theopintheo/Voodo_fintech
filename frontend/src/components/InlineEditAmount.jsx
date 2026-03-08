import React, { useState, useRef, useEffect } from 'react';

function InlineEditAmount({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    } else {
      setEditValue(value);
    }
  }, [isEditing, value]);

  const handleSave = () => {
    setIsEditing(false);
    if (Number(editValue) !== value) {
      onSave(Number(editValue));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        className="chat-input"
        style={{ width: '100px', fontSize: 'inherit', padding: '4px 8px', height: 'auto', fontWeight: 'bold' }}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      style={{ cursor: 'pointer', borderBottom: '1px dashed var(--accent-purple)', paddingBottom: '2px', display: 'inline-block' }}
      title="Click to edit"
    >
      ₹{value.toLocaleString('en-IN')}
    </span>
  );
}

export default InlineEditAmount;
