'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  Strikethrough,
  Type,
} from 'lucide-react';

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Type Your Reply...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[220px] p-4 text-neutral-800',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const toggleHeading = () => {
    if (editor.isActive('heading', { level: 2 })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    }
  };

  const cycleAlignment = () => {
    if (editor.isActive({ textAlign: 'left' })) {
      editor.chain().focus().setTextAlign('center').run();
    } else if (editor.isActive({ textAlign: 'center' })) {
      editor.chain().focus().setTextAlign('right').run();
    } else {
      editor.chain().focus().setTextAlign('left').run();
    }
  };

  return (
    <div className="w-full flex flex-col rounded-xl overflow-hidden border border-neutral-100 bg-white">
      {/* Editor Content Area */}
      <div className="min-h-[260px] bg-neutral-50/40">
        <EditorContent editor={editor} />
      </div>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50 border-t border-neutral-200/70 select-none">
        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-neutral-200 text-neutral-600 disabled:opacity-40"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-neutral-200 text-neutral-600 disabled:opacity-40"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-300 mx-1" />

        {/* Text Style / Size */}
        <button
          type="button"
          onClick={toggleHeading}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('heading') ? 'bg-neutral-200 text-neutral-900 font-bold' : ''
          }`}
          title="Toggle Heading"
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-300 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('bold') ? 'bg-neutral-200 text-neutral-900 font-bold' : ''
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('italic') ? 'bg-neutral-200 text-neutral-900' : ''
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('underline') ? 'bg-neutral-200 text-neutral-900' : ''
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('strike') ? 'bg-neutral-200 text-neutral-900' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={cycleAlignment}
          className="p-1.5 rounded hover:bg-neutral-200 text-neutral-600"
          title="Text Alignment"
        >
          {editor.isActive({ textAlign: 'center' }) ? (
            <AlignCenter className="w-4 h-4" />
          ) : editor.isActive({ textAlign: 'right' }) ? (
            <AlignRight className="w-4 h-4" />
          ) : (
            <AlignLeft className="w-4 h-4" />
          )}
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('bulletList') ? 'bg-neutral-200 text-neutral-900' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('orderedList') ? 'bg-neutral-200 text-neutral-900' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Indent / Outdent */}
        <button
          type="button"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          className="p-1.5 rounded hover:bg-neutral-200 text-neutral-600"
          title="Indent"
        >
          <Indent className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          className="p-1.5 rounded hover:bg-neutral-200 text-neutral-600"
          title="Outdent"
        >
          <Outdent className="w-4 h-4" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded text-neutral-600 hover:bg-neutral-200 ${
            editor.isActive('blockquote') ? 'bg-neutral-200 text-neutral-900' : ''
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
