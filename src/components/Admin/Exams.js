import React, { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import dayjs from "dayjs";
import mammoth from "mammoth";
import {
  checkLatexContent,
  extractQuestionRange,
  isBreak,
  isNumeric,
  isTitleAnswers,
  isValidateContentQuestion,
  toLowerCaseNonAccentVietnamese,
  validateGoogleDriveUrl,
} from "../../common/Utils";
import { toast } from "react-toastify";
import axios from "axios";
import {
  activeExam,
  deleteExam,
  getExams,
  insertOrUpdateExam,
} from "../../services/ExamService";
import UploadService from "../../services/UploadService";
import ExamForm from "./ExamForm";
import { Tooltip } from "@mui/material";
import { REACT_APP_API_UPLOAD_URL } from "../../common/apiClient";

const configDate = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh", // hoặc remove nếu dùng UTC
};

export default function Exams() {
  // ]);
  const [formQuestionData, setFormData] = useState({
    title: "",
    numberOfQuestions: 0,
    time: 0,
    // startTime: dayjs(new Date()),
    // endTime: dayjs(new Date()),
    subject: "",
    imgUrrl: "",
    module: "",
  });

  // Fix scroll issue
  useEffect(() => {
    // Đảm bảo body có thể scroll
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    // Reset any fixed heights
    const appRoot = document.getElementById("root");
    if (appRoot) {
      appRoot.style.height = "auto";
      appRoot.style.minHeight = "100vh";
      appRoot.style.overflow = "visible";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const refs = {
    inputRef: useRef(null),
    inputRefQuestion: useRef(null),
    imageRefQuestion: useRef(null),
    imageRefAnswerQuestion: useRef(null),
    imageRefExam: useRef(null),
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;
  const [isEditing, setIsEditing] = useState(null);
  const [isSearch, setIsSearch] = useState(false);
  const [openDialogQuestion, setOpenDialogQuestion] = useState(false);
  const [openDialogExam, setOpenDialogExam] = useState(false);
  const [rows, setRows] = useState([]);
  const [listExams, setListExams] = useState([]);
  const [answer, setAnswer] = useState({});
  console.log("🚀 ~ Exams ~ answer:", answer);
  const [listKeys, setListKeys] = useState([]);
  const [question, setQuestion] = useState({
    question: "Câu 1",
    contentQuestions: "",
    imageUrl: "",
    type: "",
  });
  const [questionsData, setQuestionsData] = useState([]);
  const [errors, setErrors] = useState({
    title: false,
    url: false,
    numberOfQuestions: false,
    time: false,
    // startTime: false,
    module: false,
    // endTime: false,
  });
  const examsPerPage = 5;
  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const [searchQuery, setSearchQuery] = useState("");

  const handleDeleteExam = async (id) => {
    try {
      const res = await deleteExam(id);
      toast.success(res?.message);
      setListExams(listExams.filter((exam) => exam?._id !== id));
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  const upLoadImageQuestions = async (event) => {
    try {
      const file = event.target?.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Chỉ cho phép upload file ảnh!");
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File quá lớn! Kích thước tối đa là 5MB.");
          return;
        }

        const response = await UploadService.uploadQuestionImage(file);

        if (response && response.data && response.data.imageUrl) {
          const imageUrl = `${REACT_APP_API_UPLOAD_URL}${response.data.imageUrl}`;

          console.log(" upLoadImageQuestions ~ imageUrl:", imageUrl);
          setQuestion({
            ...question,
            imageUrl: imageUrl,
          });

          const ques = questionsData.find(
            (e) => e.question === question.question
          );
          if (ques) {
            ques.imageUrl = imageUrl;
          }

          toast.success(response.message || "Tải ảnh lên thành công");
          refs.imageRefQuestion.current.value = null;
        } else {
          toast.error("Tải ảnh lên thất bại");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      const message = error?.response?.data?.message || "Lỗi khi tải ảnh lên";
      toast.error(message);
    }
  };

  const upLoadImageExam = async (event) => {
    try {
      const file = event.target?.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Chỉ cho phép upload file ảnh!");
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File quá lớn! Kích thước tối đa là 5MB.");
          return;
        }

        const response = await UploadService.uploadQuestionImage(file);

        if (response && response.data && response.data.imageUrl) {
          const imageUrl = `http://localhost:4000${response.data.imageUrl}`;

          setFormData({
            ...formQuestionData,
            imgUrl: imageUrl,
          });

          toast.success(response.message || "Tải ảnh lên thành công");
          refs.imageRefExam.current.value = null;
        } else {
          toast.error("Tải ảnh lên thất bại");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      const message = error?.response?.data?.message || "Lỗi khi tải ảnh lên";
      toast.error(message);
    }
  };

  const setDataInputQuestion = (key, parsedData) => {
    if (parsedData.length > 0) {
      const tempObjectQuestion = parsedData.find((e) => key == e["question"]);
      if (tempObjectQuestion) {
        setQuestion(tempObjectQuestion);
      }
      return;
    }
    setQuestion({
      question: key,
      contentQuestions: "",
      imageUrl: "",
    });
  };

  const handleFetch = async () => {
    try {
      const response = await getExams(currentPage, limit, searchQuery);
      setListExams(response?.data);
      setTotalPages(response?.totalPages);
      setCurrentPage(response?.currentPage);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [currentPage]);

  // không cần xử lý hàm này nữa vì đã có hàm processQuestionsFromDocx
  // function processQuestionsFromFileAdvanced(data) {
  //   if (!data) return [];

  //   const lines = data
  //     .split("\n")
  //     ?.filter((e) => e.replace(/\r/g, "").trim() !== "")
  //     .filter(Boolean);
  //   let questionsArray = [];
  //   let currentQuestion = null;
  //   let currentQuestionMQ = null;
  //   let tempQ = "";
  //   for (let i = 0; i < lines.length; i++) {
  //     let line = lines[i].trim() || "";

  //     if (line.startsWith("Câu")) {
  //       // const question_uuid = generateUUID();
  //       if (currentQuestion) {
  //         questionsArray.push(currentQuestion);
  //       }

  //       if (currentQuestionMQ && currentQuestionMQ?.contentQuestions) {
  //         questionsArray.push(currentQuestionMQ);
  //         currentQuestionMQ = null;
  //       }
  //       const cq = line.split(/[:.](.+)/)[1]?.trim() || "";
  //       tempQ =
  //         line.match(/(Câu \d+)/)?.[0] || line.match(/(Câu hỏi \d+)/)?.[0];
  //       currentQuestion = {
  //         question:
  //           line.match(/(Câu \d+)/)?.[0] || line.match(/(Câu hỏi \d+)/)?.[0],
  //         contentQuestions: cq,
  //         items: [],
  //         type: "TLN",
  //         subQuestion: "",
  //         explanation: "",
  //       };
  //       let isCheckLatext = false;
  //       for (let j = i + 1; j < lines.length; j++) {
  //         let line_question = lines[j].trim() || "";

  //         if (
  //           isBreak(line_question, isCheckLatext) ||
  //           line_question.startsWith("MQ:")
  //         ) {
  //           break;
  //         }
  //         if (currentQuestion.contentQuestions) {
  //           currentQuestion.contentQuestions += "\n" + line_question;
  //         } else {
  //           currentQuestion.contentQuestions += line_question;
  //         }
  //       }
  //     } else if (
  //       line.startsWith("A.") ||
  //       line.startsWith("B.") ||
  //       line.startsWith("C.") ||
  //       line.startsWith("D.") ||
  //       line.startsWith("A)") ||
  //       line.startsWith("B)") ||
  //       line.startsWith("C)") ||
  //       line.startsWith("D)")
  //     ) {
  //       currentQuestion.type = "TN";
  //       let lineArr = line.split(/(?=[ABCD][\.\)]\s?)/);
  //       const contentAnswerA = lineArr.find(
  //         (e) => e?.startsWith("A.") || e?.startsWith("A)")
  //       );
  //       const contentAnswerB = lineArr.find(
  //         (e) => e?.startsWith("B.") || e?.startsWith("B)")
  //       );
  //       const contentAnswerC = lineArr.find(
  //         (e) => e?.startsWith("C.") || e?.startsWith("C)")
  //       );
  //       const contentAnswerD = lineArr.find(
  //         (e) => e?.startsWith("D.") || e?.startsWith("D)")
  //       );
  //       if (contentAnswerA) {
  //         if (!currentQuestion.contentAnswerA) {
  //           // Handle both A. and A) formats
  //           const isParenFormat = contentAnswerA.startsWith("A)");
  //           currentQuestion.contentAnswerA = isParenFormat
  //             ? contentAnswerA.startsWith("A) ")
  //               ? contentAnswerA.substring(3)
  //               : contentAnswerA.substring(2)
  //             : contentAnswerA.startsWith("A. ")
  //             ? contentAnswerA.substring(3)
  //             : contentAnswerA.substring(2);

  //           for (let j = i + 1; j < lines.length; j++) {
  //             let line_A = lines[j].trim() || "";
  //             if (
  //               line_A.startsWith("B.") ||
  //               line_A.startsWith("C.") ||
  //               line_A.startsWith("D.") ||
  //               line_A.startsWith("B)") ||
  //               line_A.startsWith("C)") ||
  //               line_A.startsWith("D)")
  //             ) {
  //               break;
  //             }

  //             if (
  //               line_A.startsWith("Câu") ||
  //               isTitleAnswers(line_A) ||
  //               line_A.startsWith("MQ:")
  //             ) {
  //               break;
  //             }

  //             currentQuestion.contentAnswerA += "\n" + line_A;
  //           }
  //         }
  //       }
  //       if (contentAnswerB) {
  //         if (!currentQuestion.contentAnswerB) {
  //           // Handle both B. and B) formats
  //           const isParenFormat = contentAnswerB.startsWith("B)");
  //           currentQuestion.contentAnswerB = isParenFormat
  //             ? contentAnswerB.startsWith("B) ")
  //               ? contentAnswerB.substring(3)
  //               : contentAnswerB.substring(2)
  //             : contentAnswerB.startsWith("B. ")
  //             ? contentAnswerB.substring(3)
  //             : contentAnswerB.substring(2);

  //           for (let j = i + 1; j < lines.length; j++) {
  //             let line_B = lines[j].trim() || "";

  //             if (
  //               line_B.startsWith("C.") ||
  //               line_B.startsWith("D.") ||
  //               line_B.startsWith("C)") ||
  //               line_B.startsWith("D)")
  //             ) {
  //               break;
  //             }

  //             if (
  //               line_B.startsWith("Câu") ||
  //               isTitleAnswers(line_B) ||
  //               line_B.startsWith("MQ:")
  //             ) {
  //               break;
  //             }
  //             currentQuestion.contentAnswerB += "\n" + line_B;
  //           }
  //         }
  //       }
  //       if (contentAnswerC) {
  //         if (!currentQuestion.contentAnswerC) {
  //           // Handle both C. and C) formats
  //           const isParenFormat = contentAnswerC.startsWith("C)");
  //           currentQuestion.contentAnswerC = isParenFormat
  //             ? contentAnswerC.startsWith("C) ")
  //               ? contentAnswerC.substring(3)
  //               : contentAnswerC.substring(2)
  //             : contentAnswerC.startsWith("C. ")
  //             ? contentAnswerC.substring(3)
  //             : contentAnswerC.substring(2);

  //           for (let j = i + 1; j < lines.length; j++) {
  //             let line_C = lines[j].trim() || "";

  //             if (line_C.startsWith("D.") || line_C.startsWith("D)")) {
  //               break;
  //             }
  //             if (
  //               line_C.startsWith("Câu") ||
  //               isTitleAnswers(line_C) ||
  //               line_C.startsWith("MQ:")
  //             ) {
  //               break;
  //             }
  //             currentQuestion.contentAnswerC += "\n" + line_C;
  //           }
  //         }
  //       }
  //       if (contentAnswerD) {
  //         if (!currentQuestion.contentAnswerD) {
  //           // Handle both D. and D) formats
  //           const isParenFormat = contentAnswerD.startsWith("D)");
  //           currentQuestion.contentAnswerD = isParenFormat
  //             ? contentAnswerD.startsWith("D) ")
  //               ? contentAnswerD.substring(3)
  //               : contentAnswerD.substring(2)
  //             : contentAnswerD.startsWith("D. ")
  //             ? contentAnswerD.substring(3)
  //             : contentAnswerD.substring(2);

  //           for (let j = i + 1; j < lines.length; j++) {
  //             let line_D = lines[j].trim() || "";

  //             if (
  //               line_D.startsWith("Câu") ||
  //               isTitleAnswers(line_D) ||
  //               line_D.startsWith("MQ:")
  //             ) {
  //               break;
  //             }
  //             currentQuestion.contentAnswerD += "\n" + line_D;
  //           }
  //         }
  //       }
  //     } else if (line.startsWith("SUB:") || line.startsWith("sub:")) {
  //       currentQuestion.subQuestion = line.substring(4).trim();

  //       for (let j = i + 1; j < lines.length; j++) {
  //         let line_sub = lines[j].trim() || "";
  //         if (
  //           line_sub.startsWith("A.") ||
  //           line_sub.startsWith("B.") ||
  //           line_sub.startsWith("C.") ||
  //           line_sub.startsWith("D.") ||
  //           line_sub.startsWith("A)") ||
  //           line_sub.startsWith("B)") ||
  //           line_sub.startsWith("C)") ||
  //           line_sub.startsWith("D)")
  //         ) {
  //           break;
  //         }
  //         currentQuestion.subQuestion += "\n" + line_sub;
  //       }
  //     } else if (
  //       line.startsWith("Explanation:") ||
  //       line.startsWith("EXPLANATION:")
  //     ) {
  //       // Trường hợp 1: Explanation cùng dòng
  //       const explanationMatch = line.match(/^Explanation:\s*(.+)/i);
  //       if (explanationMatch && explanationMatch[1].trim()) {
  //         currentQuestion.explanation = explanationMatch[1].trim();
  //       } else {
  //         // Trường hợp 2: Explanation ở dòng riêng, đọc nội dung từ dòng tiếp theo
  //         for (let j = i + 1; j < lines.length; j++) {
  //           let line_explanation = lines[j].trim() || "";

  //           // Nếu gặp câu hỏi mới hoặc đáp án thì dừng
  //           if (
  //             line_explanation.startsWith("Câu") ||
  //             line_explanation.startsWith("A.") ||
  //             line_explanation.startsWith("B.") ||
  //             line_explanation.startsWith("C.") ||
  //             line_explanation.startsWith("D.") ||
  //             line_explanation.startsWith("A)") ||
  //             line_explanation.startsWith("B)") ||
  //             line_explanation.startsWith("C)") ||
  //             line_explanation.startsWith("D)") ||
  //             line_explanation.startsWith("MQ:")
  //           ) {
  //             break;
  //           }

  //           // Thêm vào explanation
  //           if (line_explanation && line_explanation.length > 0) {
  //             if (currentQuestion.explanation) {
  //               currentQuestion.explanation += "\n" + line_explanation;
  //             } else {
  //               currentQuestion.explanation = line_explanation;
  //             }
  //           }
  //         }
  //       }
  //     } else if (
  //       line.startsWith("Đáp án:") ||
  //       line.startsWith("DA:") ||
  //       line.startsWith("Trả lời:")
  //     ) {
  //       currentQuestion.type = "TLN";
  //     }
  //   }
  //   if (currentQuestion) {
  //     questionsArray.push(currentQuestion);
  //   }

  //   // Validate questionsArray trước khi return
  //   const isValid = validateQuestionsArray(questionsArray);
  //   if (!isValid) {
  //     console.log("❌ Validation failed for questions from .txt file");
  //     return []; // Return empty array nếu validation fail
  //   }

  //   // const resultvalidateQuestion = validateQuestion(questionsArray);
  //   // if (!resultvalidateQuestion?.flag) {
  //   //   resultvalidateQuestion.messageArr.forEach((message) =>
  //   //     toast.error(message || "Lỗi", {
  //   //       autoClose: 25000, // 25 giây
  //   //       closeOnClick: true,
  //   //       pauseOnHover: true,
  //   //       draggable: true,
  //   //     })
  //   //   );

  //   //   return [];
  //   // }
  //   toast.success("Nhập câu hỏi thành công");
  //   console.log(
  //     " processQuestionsFromFileAdvanced ~ questionsArray:",
  //     questionsArray
  //   );
  //   return questionsArray;
  // }

  // Hàm xử lý file .docx
  async function processQuestionsFromDocxEN(file) {
    try {
      // Store uploaded images URLs
      const uploadedImages = new Map();
      // Store temporary image data for conditional upload
      const tempImageData = new Map();

      // Đọc file .docx và chuyển đổi sang HTML với định dạng
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            // Giữ nguyên định dạng bold, italic, underline
            "b => strong",
            "i => em",
            "u => u",
            // Thêm các định dạng khác
            "strike => del", // Gạch ngang
            "sub => sub", // Subscript
            "sup => sup", // Superscript
            // Color formatting
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            // List formatting - cải thiện
            "p[style-name='List Paragraph'] => li",
            "p[style-name='ListParagraph'] => li",
            "p[style-name='Bullet List'] => li",
            "p[style-name='BulletList'] => li",
            // Font colors và highlights
            "r[style-name='Red Text'] => span.text-red",
            "r[style-name='Blue Text'] => span.text-blue",
            "r[style-name='Green Text'] => span.text-green",
            "r[style-name='Highlight'] => mark",
            // Có thể thêm các style mapping khác nếu cần
          ],
          // Thêm options để preserve formatting tốt hơn
          includeDefaultStyleMap: true,
          includeEmbeddedStyleMap: true,
          // Convert functions cho images - validation trước rồi upload
          convertImage: mammoth.images.imgElement(async function (image) {
            try {
              console.log(
                "Processing image from Word document for validation..."
              );

              // Read image as buffer
              const imageBuffer = await image.read();

              // Tạo unique key cho image
              const imageKey = `temp-image-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;

              // Lưu thông tin image để upload sau nếu validation thành công
              tempImageData.set(imageKey, {
                buffer: imageBuffer,
                contentType: image.contentType,
                altText: image.altText || "Image from Word document",
                originalName: `word-image-${Date.now()}.${
                  image.contentType.split("/")[1]
                }`,
              });

              // Tạo base64 tạm thời cho việc validation và hiển thị
              const base64 = `data:${image.contentType};base64,${Buffer.from(
                imageBuffer
              ).toString("base64")}`;

              console.log("Image processed for validation. Key:", imageKey);

              return {
                src: base64,
                alt: image.altText || "Image from Word document",
                "data-temp-key": imageKey, // Đánh dấu để upload sau
                class: "mx-auto",
              };
            } catch (error) {
              console.error("Error processing image for validation:", error);
              return {
                src: "",
                alt: "Error loading image",
              };
            }
          }),
          // Transform cho các element đặc biệt
          transformDocument: mammoth.transforms.paragraph(function (element) {
            // Xử lý bullet points và numbering
            if (element.numbering) {
              // Nếu là numbered list
              if (element.numbering.level !== undefined) {
                return {
                  ...element,
                  styleId: "numbered-list",
                  styleName: "Numbered List",
                };
              } else {
                // Bullet list
                return {
                  ...element,
                  styleId: "bullet-list",
                  styleName: "Bullet List",
                };
              }
            }

            return element;
          }),
        }
      );

      console.log(
        "Total images stored for conditional upload:",
        tempImageData.size
      );

      // Post-process HTML để wrap li elements trong ul
      let processedHtmlContent = result.value;

      // Clean up và format lists
      const cleanupLists = (html) => {
        // Remove br tags ở đầu và cuối content
        html = html.replace(/^(\s*<br\s*\/?>)+/gi, "");
        html = html.replace(/(\s*<br\s*\/?>)+$/gi, "");

        // Remove multiple consecutive br tags
        html = html.replace(/(<br\s*\/?>){2,}/gi, "<br/>");

        // Wrap consecutive li elements trong ul tags
        html = html.replace(
          /(<li[^>]*>.*?<\/li>)(\s*<li[^>]*>.*?<\/li>)*/g,
          function (match) {
            return "<ul>" + match + "</ul>";
          }
        );

        // Remove nested ul trong ul (nếu có)
        html = html.replace(/<ul>\s*<ul>/g, "<ul>");
        html = html.replace(/<\/ul>\s*<\/ul>/g, "</ul>");

        // Đảm bảo li elements có content
        html = html.replace(/<li[^>]*>\s*<\/li>/g, "");

        // Remove br tags ngay sau opening tags và trước closing tags
        html = html.replace(/(<[^\/][^>]*>)\s*<br\s*\/?>/gi, "$1");
        html = html.replace(/<br\s*\/?>\s*(<\/[^>]+>)/gi, "$1");

        return html;
      };

      processedHtmlContent = cleanupLists(processedHtmlContent);

      const htmlContent = processedHtmlContent;
      console.log("HTML content from docx:", htmlContent);

      // Parse HTML để tách câu hỏi
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      // Lấy tất cả text nodes và elements
      const allContent = doc.body.innerHTML;

      // Debug: log raw HTML content
      console.log("Raw HTML from mammoth:", allContent);

      // Tách thành các dòng, giữ nguyên HTML tags và loại bỏ dòng trống
      const lines = allContent
        .split(/<\/p>|<br\s*\/?>/)
        .map((line) => line.replace(/<p[^>]*>/g, "").trim())
        .filter((line) => line && line !== "" && line.length > 0); // Xóa dòng trống

      console.log("Parsed lines after filtering:", lines);

      let questionsArray = [];
      let currentQuestion = null;

      // Helper function để clean content
      const cleanContent = (content) => {
        if (!content) return content;

        // Remove br tags ở đầu và cuối
        content = content.replace(/^(\s*<br\s*\/?>)+/gi, "");
        content = content.replace(/(\s*<br\s*\/?>)+$/gi, "");

        // Replace multiple consecutive br tags
        content = content.replace(/(<br\s*\/?>){3,}/gi, "<br/><br/>");

        return content.trim();
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim() || "";
        // // Skip empty lines
        if (!line || line.length === 0) continue;

        if (/^\s*\d+\./.test(line)) {
          // Kiểm tra nếu là câu hỏi mới (bắt đầu bằng số như "1.", "2.", etc.)
          const questionMatch = line.match(/^(\d+)\.\s*(.*)/);
          // Lưu câu hỏi trước đó nếu có
          if (currentQuestion) {
            questionsArray.push(currentQuestion);
          }

          const questionNumber = questionMatch[1];
          const questionContent = questionMatch[2];

          currentQuestion = {
            question: `Câu ${questionNumber}`,
            contentQuestions: cleanContent(questionContent),
            type: "TN", // Mặc định là trắc nghiệm
            contentAnswerA: "",
            contentAnswerB: "",
            contentAnswerC: "",
            contentAnswerD: "",
            correctAnswer: "",
            explanation: "",
          };

          // Đọc tiếp để lấy phần còn lại của câu hỏi (cho đến khi gặp đáp án)
          for (let j = i + 1; j < lines.length; j++) {
            let nextLine = lines[j].trim() || "";

            // Nếu gặp đáp án A, B, C, D thì dừng
            if (
              nextLine.match(
                /^(?:<strong>)?([ABCD])[\.\)]\s*(.+?)(?:<\/strong>)?$/
              )
            ) {
              break;
            }

            // Nếu gặp câu hỏi tiếp theo thì dừng
            if (/^\s*\d+\./.test(nextLine)) {
              break;
            }

            // Nếu gặp Explanation thì dừng (sẽ xử lý riêng)
            if (nextLine.match(/^Explanation:/i)) {
              break;
            }

            // Thêm vào nội dung câu hỏi nếu không phải dòng trống
            if (nextLine && nextLine.length > 0) {
              currentQuestion.contentQuestions += "<br/>" + nextLine;
            }
          }
        }

        // Kiểm tra nếu là đáp án A, B, C, D
        const answerMatch = line.match(
          /^(?:<strong>)?([ABCD])[\.\)]\s*(.+?)(?:<\/strong>)?$/
        );

        if (answerMatch && currentQuestion) {
          const answerLetter = answerMatch[1];
          let answerContent = answerMatch[2];
          // Phương pháp detect đáp án đúng tốt hơn
          let isBold = false;

          console.log(`🔍 Checking line for bold: ${line}`);

          // Phương pháp 1: Parse line thành DOM để kiểm tra chính xác
          const tempDoc = parser.parseFromString(
            `<div>${line}</div>`,
            "text/html"
          );

          const boldElements = tempDoc.querySelectorAll("strong, b");

          // Kiểm tra xem có tag bold nào chứa pattern đáp án không
          boldElements.forEach((boldEl) => {
            const boldText = boldEl.textContent || boldEl.innerText;
            console.log(`Found bold element: "${boldText}"`);
            if (boldText && boldText.match(/^[ABCD][\.\)]\s*/)) {
              isBold = true;
              console.log(`✅ Found bold answer pattern: ${boldText}`);
            }
          });

          // Phương pháp 2: Kiểm tra nếu toàn bộ line nằm trong bold tag
          if (!isBold) {
            const wholeBoldMatch = line.match(
              /<(strong|b)[^>]*>([^<]*[ABCD][\.\)][^<]*)<\/(strong|b)>/
            );
            if (wholeBoldMatch) {
              isBold = true;
              console.log(`✅ Found whole line bold: ${wholeBoldMatch[2]}`);
            }
          }

          // Phương pháp 3: Kiểm tra nếu đáp án được bao bọc bởi bold
          if (!isBold) {
            const answerInBold = line.match(
              /<(strong|b)[^>]*>.*?([ABCD][\.\)].*?)<\/(strong|b)>/
            );
            if (answerInBold) {
              isBold = true;
              console.log(`✅ Found answer in bold: ${answerInBold[2]}`);
            }
          }

          // Phương pháp 4: Fallback - kiểm tra simple contains
          if (!isBold) {
            isBold =
              answerContent.includes("<strong>") ||
              answerContent.includes("<b>") ||
              line.includes("<strong>") ||
              line.includes("<b>") ||
              // Kiểm tra pattern **text** (markdown bold)
              answerContent.includes("**");
          }

          if (isBold) {
            currentQuestion.correctAnswer = answerLetter;
            console.log(
              `✅ FINAL: Detected correct answer for ${currentQuestion.question}: ${answerLetter}`
            );
            console.log(`Bold content: ${line}`);
          } else {
            console.log(`❌ No bold detected for ${answerLetter}: ${line}`);
          }

          // Đọc tiếp để lấy phần còn lại của đáp án (nếu có nhiều dòng)
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();

            // Nếu gặp đáp án khác hoặc câu hỏi mới hoặc Explanation thì dừng
            if (
              nextLine.match(
                /^(?:<strong>)?([ABCD])[\.\)]\s*(.+?)(?:<\/strong>)?$/
              ) ||
              /^\s*\d+\./.test(nextLine) ||
              nextLine.match(/^Explanation:/i)
            ) {
              break;
            }

            // Thêm vào nội dung đáp án nếu không phải dòng trống
            if (nextLine && nextLine.length > 0) {
              answerContent += "<br/>" + nextLine;
            }
          }

          // Gán vào đáp án tương ứng
          switch (answerLetter) {
            case "A":
              currentQuestion.contentAnswerA = cleanContent(answerContent);
              break;
            case "B":
              currentQuestion.contentAnswerB = cleanContent(answerContent);
              break;
            case "C":
              currentQuestion.contentAnswerC = cleanContent(answerContent);
              break;
            case "D":
              currentQuestion.contentAnswerD = cleanContent(answerContent);
              break;
          }
        }

        // Kiểm tra nếu là Explanation
        if (line.match(/^Explanation:/i) && currentQuestion) {
          console.log(`🔍 Found Explanation line: ${line}`);

          // Trường hợp 1: Explanation cùng dòng
          const explanationMatch = line.match(/^Explanation:\s*(.+)/i);
          if (explanationMatch && explanationMatch[1].trim()) {
            currentQuestion.explanation = cleanContent(
              explanationMatch[1].trim()
            );
            console.log(
              `✅ Same line explanation: ${currentQuestion.explanation}`
            );

            // Tiếp tục đọc các dòng tiếp theo để lấy phần explanation còn lại
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j].trim();

              // Nếu gặp câu hỏi mới thì dừng
              if (/^\s*\d+\./.test(nextLine)) {
                break;
              }

              // Nếu có nội dung explanation tiếp theo
              if (nextLine && nextLine.length > 0) {
                currentQuestion.explanation += "<br/>" + nextLine;
                console.log(
                  `📝 Extended explanation: ${currentQuestion.explanation}`
                );
              }
            }
          } else {
            // Trường hợp 2: Explanation ở dòng riêng, nội dung ở dòng sau
            console.log(`🔍 Looking for explanation in next lines...`);

            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j].trim();

              // Nếu gặp câu hỏi mới thì dừng
              if (/^\s*\d+\./.test(nextLine)) {
                break;
              }

              // Nếu có nội dung explanation
              if (nextLine && nextLine.length > 0) {
                if (currentQuestion.explanation) {
                  currentQuestion.explanation += "<br/>" + nextLine;
                } else {
                  currentQuestion.explanation = cleanContent(nextLine);
                }
                console.log(
                  `✅ Multi-line explanation updated: ${currentQuestion.explanation}`
                );
              }
            }
          }
        }
      }

      // Thêm câu hỏi cuối cùng
      if (currentQuestion) {
        questionsArray.push(currentQuestion);
      }

      // Tự động tạo answer object từ các đáp án đúng đã được detect
      const autoAnswer = {};
      questionsArray.forEach((q, index) => {
        if (q.correctAnswer) {
          autoAnswer[q.question] = q.correctAnswer;
        } else {
          // Nếu không detect được đáp án đúng, mặc định là A
          autoAnswer[q.question] = "X";
          toast.error("Không tìm thấy đáp án đúng cho câu hỏi: " + q.question);
        }
      });

      console.log("Auto-generated answer object:", autoAnswer);

      // Cập nhật answer state với dữ liệu tự động tạo
      setAnswer(autoAnswer);

      const detectedAnswers = Object.keys(autoAnswer).filter(
        (key) => autoAnswer[key] !== "X"
      ).length;

      const successMessage =
        uploadedImages.size > 0
          ? `Nhập câu hỏi từ file Word thành công! Đã detect ${detectedAnswers} đáp án đúng và upload ${uploadedImages.size} ảnh.`
          : `Nhập câu hỏi từ file Word thành công! Đã detect ${detectedAnswers} đáp án đúng tự động.`;

      // Log explanation statistics
      const questionsWithExplanation = questionsArray.filter(
        (q) => q.explanation && q.explanation.trim().length > 0
      );
      console.log(
        `📝 Found ${questionsWithExplanation.length} questions with explanations`
      );
      questionsWithExplanation.forEach((q) => {
        console.log(`✅ ${q.question}: ${q.explanation.substring(0, 100)}...`);
      });
      console.log("✅ QuestionsArray:", questionsArray);
      // Validate questionsArray trước khi return
      const isValid = validateQuestionsArrayEN(questionsArray);
      if (!isValid) {
        console.log("❌ Validation failed for questions from .docx file");
        toast.error(
          "Validation thất bại. Ảnh sẽ không được upload lên server."
        );
        // return []; // Return empty array nếu validation fail
        return questionsArray; // Trả về với base64 images
      }

      // ✅ Validation thành công - Bắt đầu upload ảnh lên server
      console.log("✅ Validation passed! Starting image upload to server...");
      toast.info("Validation thành công! Đang upload ảnh lên server...");

      try {
        // Upload tất cả ảnh lên server
        const uploadPromises = [];
        for (const [imageKey, imageData] of tempImageData) {
          const uploadPromise = (async () => {
            try {
              // Create file from buffer for upload
              const imageFile = new File(
                [imageData.buffer],
                imageData.originalName,
                {
                  type: imageData.contentType,
                }
              );

              console.log(
                "Uploading image:",
                imageFile.name,
                "Size:",
                imageFile.size
              );

              // Upload image to server
              const uploadResponse = await UploadService.uploadQuestionImage(
                imageFile
              );

              if (
                uploadResponse &&
                uploadResponse.data &&
                uploadResponse.data.imageUrl
              ) {
                const serverImageUrl = `${REACT_APP_API_UPLOAD_URL}${uploadResponse.data.imageUrl}`;
                console.log("Image uploaded successfully:", serverImageUrl);

                return { imageKey, serverImageUrl, success: true };
              } else {
                console.error("Failed to upload image:", imageKey);
                return { imageKey, serverImageUrl: null, success: false };
              }
            } catch (error) {
              console.error("Error uploading image:", imageKey, error);
              return {
                imageKey,
                serverImageUrl: null,
                success: false,
                error: error.message,
              };
            }
          })();

          uploadPromises.push(uploadPromise);
        }

        // Đợi tất cả ảnh upload xong
        const uploadResults = await Promise.all(uploadPromises);

        // Tạo mapping từ temp key sang server URL
        const imageUrlMapping = new Map();
        let successCount = 0;
        let failCount = 0;

        uploadResults.forEach((result) => {
          if (result.success) {
            imageUrlMapping.set(result.imageKey, result.serverImageUrl);
            successCount++;
          } else {
            failCount++;
            console.error("Upload failed for:", result.imageKey, result.error);
          }
        });

        console.log(
          `✅ Upload completed: ${successCount} success, ${failCount} failed`
        );

        // Cập nhật các câu hỏi để thay thế base64 images bằng server URLs
        const updatedQuestionsArray = questionsArray.map((question) => {
          // Cập nhật contentQuestions
          let updatedContentQuestions = question.contentQuestions;

          // Thay thế từng image một cách chính xác
          imageUrlMapping.forEach((serverUrl, tempKey) => {
            // Tìm và thay thế img tag có data-temp-key tương ứng
            const imgRegex = new RegExp(
              `<img([^>]*?)src="data:[^"]*"([^>]*?)data-temp-key="${tempKey}"([^>]*?)>`,
              "gi"
            );

            updatedContentQuestions = updatedContentQuestions.replace(
              imgRegex,
              `<img$1src="${serverUrl}"$2data-uploaded="true"$3>`
            );

            // Fallback: nếu data-temp-key ở trước src
            const imgRegex2 = new RegExp(
              `<img([^>]*?)data-temp-key="${tempKey}"([^>]*?)src="data:[^"]*"([^>]*?)>`,
              "gi"
            );

            updatedContentQuestions = updatedContentQuestions.replace(
              imgRegex2,
              `<img$1data-uploaded="true"$2src="${serverUrl}"$3>`
            );
          });

          // Cập nhật subQuestion nếu có
          let updatedSubQuestion = question.subQuestion;
          if (updatedSubQuestion) {
            imageUrlMapping.forEach((serverUrl, tempKey) => {
              // Tìm và thay thế img tag có data-temp-key tương ứng
              const imgRegex = new RegExp(
                `<img([^>]*?)src="data:[^"]*"([^>]*?)data-temp-key="${tempKey}"([^>]*?)>`,
                "gi"
              );

              updatedSubQuestion = updatedSubQuestion.replace(
                imgRegex,
                `<img$1src="${serverUrl}"$2data-uploaded="true"$3>`
              );

              // Fallback: nếu data-temp-key ở trước src
              const imgRegex2 = new RegExp(
                `<img([^>]*?)data-temp-key="${tempKey}"([^>]*?)src="data:[^"]*"([^>]*?)>`,
                "gi"
              );

              updatedSubQuestion = updatedSubQuestion.replace(
                imgRegex2,
                `<img$1data-uploaded="true"$2src="${serverUrl}"$3>`
              );
            });
          }

          return {
            ...question,
            contentQuestions: updatedContentQuestions,
            subQuestion: updatedSubQuestion,
          };
        });

        // Backup strategy: Thay thế tất cả base64 images còn lại nếu có
        const finalUpdatedQuestionsArray = updatedQuestionsArray.map(
          (question) => {
            let updatedContentQuestions = question.contentQuestions;
            let updatedSubQuestion = question.subQuestion;

            // Nếu vẫn còn base64 images, thử thay thế bằng cách khác
            const stillHasBase64 = /data:[^;]+;base64/g.test(
              updatedContentQuestions
            );
            if (stillHasBase64) {
              console.warn(
                "🔧 Applying backup replacement strategy for remaining base64 images"
              );

              // Tìm tất cả img tags với base64 và thay thế bằng server URLs theo thứ tự
              const serverUrls = Array.from(imageUrlMapping.values());
              let urlIndex = 0;

              updatedContentQuestions = updatedContentQuestions.replace(
                /<img([^>]*?)src="data:[^"]*"([^>]*?)>/gi,
                (match, before, after) => {
                  if (urlIndex < serverUrls.length) {
                    const serverUrl = serverUrls[urlIndex];
                    urlIndex++;
                    // Remove data-temp-key và thêm data-uploaded
                    const cleanedBefore = before.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    const cleanedAfter = after.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    return `<img${cleanedBefore}src="${serverUrl}"${cleanedAfter} data-uploaded="true">`;
                  }
                  return match; // Giữ nguyên nếu không còn server URL
                }
              );
            }

            // Tương tự cho subQuestion
            if (
              updatedSubQuestion &&
              /data:[^;]+;base64/g.test(updatedSubQuestion)
            ) {
              const serverUrls = Array.from(imageUrlMapping.values());
              let urlIndex = 0;

              updatedSubQuestion = updatedSubQuestion.replace(
                /<img([^>]*?)src="data:[^"]*"([^>]*?)>/gi,
                (match, before, after) => {
                  if (urlIndex < serverUrls.length) {
                    const serverUrl = serverUrls[urlIndex];
                    urlIndex++;
                    const cleanedBefore = before.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    const cleanedAfter = after.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    return `<img${cleanedBefore}src="${serverUrl}"${cleanedAfter} data-uploaded="true">`;
                  }
                  return match;
                }
              );
            }

            return {
              ...question,
              contentQuestions: updatedContentQuestions,
              subQuestion: updatedSubQuestion,
            };
          }
        );

        // Debug: Log để kiểm tra kết quả thay thế cuối cùng
        console.log("🔍 Final image replacement results:");
        finalUpdatedQuestionsArray.forEach((q, index) => {
          const base64Count = (
            q.contentQuestions.match(/data:[^;]+;base64/g) || []
          ).length;
          const serverUrlCount = (
            q.contentQuestions.match(
              new RegExp(REACT_APP_API_UPLOAD_URL, "g")
            ) || []
          ).length;
          console.log(
            `Question ${
              index + 1
            }: ${base64Count} base64 images, ${serverUrlCount} server URLs`
          );

          if (base64Count > 0) {
            console.warn(
              `⚠️ Question ${
                index + 1
              } still has base64 images - this should not happen!`
            );
          } else {
            console.log(
              `✅ Question ${index + 1}: All images converted to server URLs`
            );
          }
        });

        if (successCount > 0) {
          toast.success(`✅ Upload thành công ${successCount} ảnh lên server!`);
        }
        if (failCount > 0) {
          toast.warning(
            `⚠️ ${failCount} ảnh upload thất bại, sẽ giữ nguyên base64`
          );
        }

        toast.success(successMessage);
        return finalUpdatedQuestionsArray;
      } catch (error) {
        toast.success(successMessage + " (ảnh sử dụng base64)");
        return questionsArray; // Trả về với base64 images nếu upload failed
      }
    } catch (error) {
      console.error("Error processing docx file:", error);
      toast.error("Lỗi khi xử lý file Word: " + error.message);
      return [];
    }
  }

  async function processQuestionsFromDocxMath(file) {
    try {
      // Store uploaded images URLs
      const uploadedImages = new Map();
      // Store temporary image data for conditional upload
      const tempImageData = new Map();

      // Đọc file .docx và chuyển đổi sang HTML với định dạng
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            // Giữ nguyên định dạng bold, italic, underline
            "b => strong",
            "i => em",
            "u => u",
            // Thêm các định dạng khác
            "strike => del", // Gạch ngang
            "sub => sub", // Subscript
            "sup => sup", // Superscript
            // Color formatting
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            // List formatting - cải thiện
            "p[style-name='List Paragraph'] => li",
            "p[style-name='ListParagraph'] => li",
            "p[style-name='Bullet List'] => li",
            "p[style-name='BulletList'] => li",
            // Font colors và highlights
            "r[style-name='Red Text'] => span.text-red",
            "r[style-name='Blue Text'] => span.text-blue",
            "r[style-name='Green Text'] => span.text-green",
            "r[style-name='Highlight'] => mark",
            // Table styles
            "table => table.word-table",
            "tr => tr.word-table-row",
            "td => td.word-table-cell",
            "th => th.word-table-header",
            "tbody => tbody.word-table-body",
            "thead => thead.word-table-head",
            // Có thể thêm các style mapping khác nếu cần
          ],
          // Thêm options để preserve formatting tốt hơn
          includeDefaultStyleMap: true,
          includeEmbeddedStyleMap: true,
          // Convert functions cho images - tạm thời chỉ tạo base64 cho validation
          convertImage: mammoth.images.imgElement(async function (image) {
            try {
              console.log(
                "Processing image from Word document for validation..."
              );

              // Read image as buffer
              const imageBuffer = await image.read();

              // Tạo unique key cho image
              const imageKey = `temp-image-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;

              // Lưu thông tin image để upload sau nếu validation thành công
              tempImageData.set(imageKey, {
                buffer: imageBuffer,
                contentType: image.contentType,
                altText: image.altText || "Image from Word document",
                originalName: `word-image-${Date.now()}.${
                  image.contentType.split("/")[1]
                }`,
              });

              // Tạo base64 tạm thời cho việc validation và hiển thị
              const base64 = `data:${image.contentType};base64,${Buffer.from(
                imageBuffer
              ).toString("base64")}`;

              console.log("Image processed for validation. Key:", imageKey);

              return {
                src: base64,
                alt: image.altText || "Image from Word document",
                "data-temp-key": imageKey, // Đánh dấu để upload sau
                class: "mx-auto",
              };
            } catch (error) {
              console.error("Error processing image for validation:", error);
              return {
                src: "",
                alt: "Error loading image",
              };
            }
          }),
          // Transform cho các element đặc biệt
          transformDocument: mammoth.transforms.paragraph(function (element) {
            // Xử lý bullet points và numbering
            if (element.numbering) {
              // Nếu là numbered list
              if (element.numbering.level !== undefined) {
                return {
                  ...element,
                  styleId: "numbered-list",
                  styleName: "Numbered List",
                };
              } else {
                // Bullet list
                return {
                  ...element,
                  styleId: "bullet-list",
                  styleName: "Bullet List",
                };
              }
            }

            return element;
          }),
        }
      );

      console.log(
        "Total images stored for conditional upload:",
        tempImageData.size
      );

      // Post-process HTML để wrap li elements trong ul
      let processedHtmlContent = result.value;

      // Clean up và format lists
      const cleanupLists = (html) => {
        // Remove br tags ở đầu và cuối content
        html = html.replace(/^(\s*<br\s*\/?>)+/gi, "");
        html = html.replace(/(\s*<br\s*\/?>)+$/gi, "");

        // Remove multiple consecutive br tags
        html = html.replace(/(<br\s*\/?>){2,}/gi, "<br/>");

        // Wrap consecutive li elements trong ul tags
        html = html.replace(
          /(<li[^>]*>.*?<\/li>)(\s*<li[^>]*>.*?<\/li>)*/g,
          function (match) {
            return "<ul>" + match + "</ul>";
          }
        );

        // Remove nested ul trong ul (nếu có)
        html = html.replace(/<ul>\s*<ul>/g, "<ul>");
        html = html.replace(/<\/ul>\s*<\/ul>/g, "</ul>");

        // Đảm bảo li elements có content
        html = html.replace(/<li[^>]*>\s*<\/li>/g, "");

        // Remove br tags ngay sau opening tags và trước closing tags
        html = html.replace(/(<[^\/][^>]*>)\s*<br\s*\/?>/gi, "$1");
        html = html.replace(/<br\s*\/?>\s*(<\/[^>]+>)/gi, "$1");

        return html;
      };

      processedHtmlContent = cleanupLists(processedHtmlContent);

      const htmlContent = processedHtmlContent;
      console.log("HTML content from docx:", htmlContent);

      // Parse HTML để tách câu hỏi
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      // Lấy tất cả text nodes và elements
      const allContent = doc.body.innerHTML;

      // Debug: log raw HTML content
      console.log("Raw HTML from mammoth:", allContent);

      // Tách thành các dòng, giữ nguyên HTML tags và loại bỏ dòng trống
      const lines = allContent
        .split(/<\/p>|<br\s*\/?>/)
        .map((line) => line.replace(/<p[^>]*>/g, "").trim())
        .filter((line) => line && line !== "" && line.length > 0); // Xóa dòng trống

      console.log("Parsed lines after filtering:", lines);

      let questionsArray = [];
      let currentQuestion = null;

      // Helper function để clean content
      const cleanContent = (content) => {
        if (!content) return content;

        // Remove br tags ở đầu và cuối
        content = content.replace(/^(\s*<br\s*\/?>)+/gi, "");
        content = content.replace(/(\s*<br\s*\/?>)+$/gi, "");

        // Replace multiple consecutive br tags
        content = content.replace(/(<br\s*\/?>){3,}/gi, "<br/><br/>");

        return content.trim();
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim() || "";
        console.log("🚀 ~ processQuestionsFromDocxMath ~ line:", line);
        // // Skip empty lines
        if (!line || line.length === 0) continue;

        if (/^\s*\d+\./.test(line)) {
          // Kiểm tra nếu là câu hỏi mới (bắt đầu bằng số như "1.", "2.", etc.)
          // const questionMatch = line.match(/^(?:<[^>]+>)*(\d+)\.\s*(.*)/);
          const questionMatch = line.match(/^(\d+)\.\s*(.*)/);

          // Lưu câu hỏi trước đó nếu có
          if (currentQuestion) {
            questionsArray.push(currentQuestion);
          }

          const questionNumber = questionMatch[1];
          const questionContent = questionMatch[2];

          currentQuestion = {
            question: `Câu ${questionNumber}`,
            contentQuestions: cleanContent(questionContent),
            type: "TN", // Mặc định là trắc nghiệm
            contentAnswerA: "",
            contentAnswerB: "",
            contentAnswerC: "",
            contentAnswerD: "",
            correctAnswer: "",
            explanation: "",
          };

          // Đọc tiếp để lấy phần còn lại của câu hỏi (cho đến khi gặp đáp án)
          for (let j = i + 1; j < lines.length; j++) {
            let nextLine = lines[j].trim() || "";

            // Nếu gặp đáp án A, B, C, D thì dừng
            if (
              nextLine.match(
                /^(?:<\/td><\/tr><\/tbody><\/table>)?\s*(?:<strong>)?([ABCD])[\.\)]\s*(.+?)(?:<\/strong>)?$/i
              )
            ) {
              break;
            }

            // Nếu gặp đáp án TLN thì dừng
            if (
              nextLine.match(
                /^(?:<strong>)?Answer:\s*(-?(?:\d*\.\d+|\d+\/\d+|\d+)(?:;-?(?:\d*\.\d+|\d+\/\d+|\d+))*)(?:<\/strong>)?$/i
              )
            ) {
              break;
            }

            // Nếu gặp câu hỏi tiếp theo thì dừng
            if (/^\s*\d+\./.test(nextLine)) {
              break;
            }

            // Nếu gặp Explanation thì dừng (sẽ xử lý riêng)
            if (nextLine.match(/^Explanation:/i)) {
              break;
            }

            // Thêm vào nội dung câu hỏi nếu không phải dòng trống
            if (nextLine && nextLine.length > 0) {
              currentQuestion.contentQuestions += "<br/>" + nextLine;
            }
          }
        }

        // Kiểm tra nếu là đáp án A, B, C, D
        const answerMatch = line.match(
          /^(?:<\/td><\/tr><\/tbody><\/table>)?\s*(?:<strong>)?([ABCD])[\.\)]\s*(.+?)(?:<\/strong>)?$/i
        );

        const answerMatchTLN = line.match(
          /^(?:<strong>)?Answer:\s*(-?(?:\d*\.\d+|\d+\/\d+|\d+)(?:;-?(?:\d*\.\d+|\d+\/\d+|\d+))*)(?:<\/strong>)?$/i
        );
        console.log(
          "🚀 ~ processQuestionsFromDocxMath ~ answerMatchTLN:",
          answerMatchTLN
        );
        if (answerMatch && currentQuestion) {
          const answerLetter = answerMatch[1];
          let answerContent = answerMatch[2];
          // Phương pháp detect đáp án đúng tốt hơn
          let isBold = false;

          console.log(`🔍 Checking line for bold: ${line}`);

          // Phương pháp 1: Parse line thành DOM để kiểm tra chính xác
          const tempDoc = parser.parseFromString(
            `<div>${line}</div>`,
            "text/html"
          );

          const boldElements = tempDoc.querySelectorAll("strong, b");

          // Kiểm tra xem có tag bold nào chứa pattern đáp án không
          boldElements.forEach((boldEl) => {
            const boldText = boldEl.textContent || boldEl.innerText;
            console.log(`Found bold element: "${boldText}"`);
            if (boldText && boldText.match(/^[ABCD][\.\)]\s*/)) {
              isBold = true;
              console.log(`✅ Found bold answer pattern: ${boldText}`);
            }
          });

          // Phương pháp 2: Kiểm tra nếu toàn bộ line nằm trong bold tag
          if (!isBold) {
            const wholeBoldMatch = line.match(
              /<(strong|b)[^>]*>([^<]*[ABCD][\.\)][^<]*)<\/(strong|b)>/
            );
            if (wholeBoldMatch) {
              isBold = true;
              console.log(`✅ Found whole line bold: ${wholeBoldMatch[2]}`);
            }
          }

          // Phương pháp 3: Kiểm tra nếu đáp án được bao bọc bởi bold
          if (!isBold) {
            const answerInBold = line.match(
              /<(strong|b)[^>]*>.*?([ABCD][\.\)].*?)<\/(strong|b)>/
            );
            if (answerInBold) {
              isBold = true;
              console.log(`✅ Found answer in bold: ${answerInBold[2]}`);
            }
          }

          // Phương pháp 4: Fallback - kiểm tra simple contains
          if (!isBold) {
            isBold =
              answerContent.includes("<strong>") ||
              answerContent.includes("<b>") ||
              line.includes("<strong>") ||
              line.includes("<b>") ||
              // Kiểm tra pattern **text** (markdown bold)
              answerContent.includes("**");
          }

          if (isBold) {
            currentQuestion.correctAnswer = answerLetter;
            console.log(
              `✅ FINAL: Detected correct answer for ${currentQuestion.question}: ${answerLetter}`
            );
            console.log(`Bold content: ${line}`);
          } else {
            console.log(`❌ No bold detected for ${answerLetter}: ${line}`);
          }

          // Đọc tiếp để lấy phần còn lại của đáp án (nếu có nhiều dòng)
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();

            // Nếu gặp đáp án khác hoặc câu hỏi mới hoặc Explanation thì dừng
            if (
              nextLine.match(
                /^(?:<\/td><\/tr><\/tbody><\/table>)?\s*(?:<strong>)?([ABCD])[\.\)]\s*(.+?)(?:<\/strong>)?$/i
              ) ||
              /^\s*\d+\./.test(nextLine) ||
              nextLine.match(/^Explanation:/i)
            ) {
              break;
            }

            // Thêm vào nội dung đáp án nếu không phải dòng trống
            if (nextLine && nextLine.length > 0) {
              answerContent += "<br/>" + nextLine;
            }
          }

          // Gán vào đáp án tương ứng
          switch (answerLetter) {
            case "A":
              currentQuestion.contentAnswerA = cleanContent(answerContent);
              break;
            case "B":
              currentQuestion.contentAnswerB = cleanContent(answerContent);
              break;
            case "C":
              currentQuestion.contentAnswerC = cleanContent(answerContent);
              break;
            case "D":
              currentQuestion.contentAnswerD = cleanContent(answerContent);
              break;
          }
        } else if (answerMatchTLN && currentQuestion) {
          currentQuestion.type = "TLN";
          delete currentQuestion.contentAnswerA;
          delete currentQuestion.contentAnswerB;
          delete currentQuestion.contentAnswerC;
          delete currentQuestion.contentAnswerD;
          if (answerMatchTLN) {
            currentQuestion.correctAnswer = answerMatchTLN[1]
              ?.split(";")
              ?.map((n) => (isNumeric(n) ? parseFloat(n) : n));
          } else {
            toast.error(
              "Đáp án đúng cho câu hỏi: " +
                currentQuestion.question +
                " không đúng định dạng"
            );
          }
        }

        // Kiểm tra nếu là Explanation
        if (line.match(/^Explanation:/i) && currentQuestion) {
          console.log(`🔍 Found Explanation line: ${line}`);

          // Trường hợp 1: Explanation cùng dòng
          const explanationMatch = line.match(/^Explanation:\s*(.+)/i);
          if (explanationMatch && explanationMatch[1].trim()) {
            currentQuestion.explanation = cleanContent(
              explanationMatch[1].trim()
            );
            console.log(
              `✅ Same line explanation: ${currentQuestion.explanation}`
            );

            // Tiếp tục đọc các dòng tiếp theo để lấy phần explanation còn lại
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j].trim();

              // Nếu gặp câu hỏi mới thì dừng
              if (/^\s*\d+\./.test(nextLine)) {
                break;
              }

              // Nếu có nội dung explanation tiếp theo
              if (nextLine && nextLine.length > 0) {
                currentQuestion.explanation += "<br/>" + nextLine;
                console.log(
                  `📝 Extended explanation: ${currentQuestion.explanation}`
                );
              }
            }
          } else {
            // Trường hợp 2: Explanation ở dòng riêng, nội dung ở dòng sau
            console.log(`🔍 Looking for explanation in next lines...`);

            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j].trim();

              // Nếu gặp câu hỏi mới thì dừng
              if (/^\s*\d+\./.test(nextLine)) {
                break;
              }

              // Nếu có nội dung explanation
              if (nextLine && nextLine.length > 0) {
                if (currentQuestion.explanation) {
                  currentQuestion.explanation += "<br/>" + nextLine;
                } else {
                  currentQuestion.explanation = cleanContent(nextLine);
                }
                console.log(
                  `✅ Multi-line explanation updated: ${currentQuestion.explanation}`
                );
              }
            }
          }
        }
      }

      // Thêm câu hỏi cuối cùng
      if (currentQuestion) {
        questionsArray.push(currentQuestion);
      }

      // Tự động tạo answer object từ các đáp án đúng đã được detect
      const autoAnswer = {};
      questionsArray.forEach((q, index) => {
        if (q.correctAnswer) {
          autoAnswer[q.question] = q.correctAnswer;
        } else {
          // Nếu không detect được đáp án đúng, mặc định là A
          autoAnswer[q.question] = "X";
          toast.error("Không tìm thấy đáp án đúng cho câu hỏi: " + q.question);
        }
      });

      console.log("Auto-generated answer object:", autoAnswer);

      // Cập nhật answer state với dữ liệu tự động tạo
      setAnswer(autoAnswer);

      const detectedAnswers = Object.keys(autoAnswer).filter(
        (key) => autoAnswer[key] !== "X"
      ).length;

      const successMessage =
        uploadedImages.size > 0
          ? `Nhập câu hỏi từ file Word thành công! Đã detect ${detectedAnswers} đáp án đúng và upload ${uploadedImages.size} ảnh.`
          : `Nhập câu hỏi từ file Word thành công! Đã detect ${detectedAnswers} đáp án đúng tự động.`;

      // Log explanation statistics
      const questionsWithExplanation = questionsArray.filter(
        (q) => q.explanation && q.explanation.trim().length > 0
      );
      console.log(
        `📝 Found ${questionsWithExplanation.length} questions with explanations`
      );
      questionsWithExplanation.forEach((q) => {
        console.log(`✅ ${q.question}: ${q.explanation.substring(0, 100)}...`);
      });
      console.log("✅ QuestionsArray:", questionsArray);
      // Validate questionsArray trước khi return
      const isValid = validateQuestionsArrayMath(questionsArray);
      if (!isValid) {
        console.log("❌ Validation failed for questions from .docx file");
        toast.error(
          "Validation thất bại. Ảnh sẽ không được upload lên server."
        );
        // return []; // Return empty array nếu validation fail
        return questionsArray; // Trả về với base64 images
      }

      // ✅ Validation thành công - Bắt đầu upload ảnh lên server
      console.log("✅ Validation passed! Starting image upload to server...");
      toast.info("Validation thành công! Đang upload ảnh lên server...");

      try {
        // Upload tất cả ảnh lên server
        const uploadPromises = [];
        for (const [imageKey, imageData] of tempImageData) {
          const uploadPromise = (async () => {
            try {
              // Create file from buffer for upload
              const imageFile = new File(
                [imageData.buffer],
                imageData.originalName,
                {
                  type: imageData.contentType,
                }
              );

              console.log(
                "Uploading image:",
                imageFile.name,
                "Size:",
                imageFile.size
              );

              // Upload image to server
              const uploadResponse = await UploadService.uploadQuestionImage(
                imageFile
              );

              if (
                uploadResponse &&
                uploadResponse.data &&
                uploadResponse.data.imageUrl
              ) {
                const serverImageUrl = `${REACT_APP_API_UPLOAD_URL}${uploadResponse.data.imageUrl}`;
                console.log("Image uploaded successfully:", serverImageUrl);

                return { imageKey, serverImageUrl, success: true };
              } else {
                console.error("Failed to upload image:", imageKey);
                return { imageKey, serverImageUrl: null, success: false };
              }
            } catch (error) {
              console.error("Error uploading image:", imageKey, error);
              return {
                imageKey,
                serverImageUrl: null,
                success: false,
                error: error.message,
              };
            }
          })();

          uploadPromises.push(uploadPromise);
        }

        // Đợi tất cả ảnh upload xong
        const uploadResults = await Promise.all(uploadPromises);

        // Tạo mapping từ temp key sang server URL
        const imageUrlMapping = new Map();
        let successCount = 0;
        let failCount = 0;

        uploadResults.forEach((result) => {
          if (result.success) {
            imageUrlMapping.set(result.imageKey, result.serverImageUrl);
            successCount++;
          } else {
            failCount++;
            console.error("Upload failed for:", result.imageKey, result.error);
          }
        });

        console.log(
          `✅ Upload completed: ${successCount} success, ${failCount} failed`
        );

        // Cập nhật các câu hỏi để thay thế base64 images bằng server URLs
        const updatedQuestionsArray = questionsArray.map((question) => {
          // Cập nhật contentQuestions
          let updatedContentQuestions = question.contentQuestions;

          // Thay thế từng image một cách chính xác
          imageUrlMapping.forEach((serverUrl, tempKey) => {
            // Tìm và thay thế img tag có data-temp-key tương ứng
            const imgRegex = new RegExp(
              `<img([^>]*?)src="data:[^"]*"([^>]*?)data-temp-key="${tempKey}"([^>]*?)>`,
              "gi"
            );

            updatedContentQuestions = updatedContentQuestions.replace(
              imgRegex,
              `<img$1src="${serverUrl}"$2data-uploaded="true"$3>`
            );

            // Fallback: nếu data-temp-key ở trước src
            const imgRegex2 = new RegExp(
              `<img([^>]*?)data-temp-key="${tempKey}"([^>]*?)src="data:[^"]*"([^>]*?)>`,
              "gi"
            );

            updatedContentQuestions = updatedContentQuestions.replace(
              imgRegex2,
              `<img$1data-uploaded="true"$2src="${serverUrl}"$3>`
            );
          });

          // Cập nhật subQuestion nếu có
          let updatedSubQuestion = question.subQuestion;
          if (updatedSubQuestion) {
            imageUrlMapping.forEach((serverUrl, tempKey) => {
              // Tìm và thay thế img tag có data-temp-key tương ứng
              const imgRegex = new RegExp(
                `<img([^>]*?)src="data:[^"]*"([^>]*?)data-temp-key="${tempKey}"([^>]*?)>`,
                "gi"
              );

              updatedSubQuestion = updatedSubQuestion.replace(
                imgRegex,
                `<img$1src="${serverUrl}"$2data-uploaded="true"$3>`
              );

              // Fallback: nếu data-temp-key ở trước src
              const imgRegex2 = new RegExp(
                `<img([^>]*?)data-temp-key="${tempKey}"([^>]*?)src="data:[^"]*"([^>]*?)>`,
                "gi"
              );

              updatedSubQuestion = updatedSubQuestion.replace(
                imgRegex2,
                `<img$1data-uploaded="true"$2src="${serverUrl}"$3>`
              );
            });
          }

          return {
            ...question,
            contentQuestions: updatedContentQuestions,
            subQuestion: updatedSubQuestion,
          };
        });

        // Backup strategy: Thay thế tất cả base64 images còn lại nếu có
        const finalUpdatedQuestionsArray = updatedQuestionsArray.map(
          (question) => {
            let updatedContentQuestions = question.contentQuestions;
            let updatedSubQuestion = question.subQuestion;

            // Nếu vẫn còn base64 images, thử thay thế bằng cách khác
            const stillHasBase64 = /data:[^;]+;base64/g.test(
              updatedContentQuestions
            );
            if (stillHasBase64) {
              console.warn(
                "🔧 Applying backup replacement strategy for remaining base64 images"
              );

              // Tìm tất cả img tags với base64 và thay thế bằng server URLs theo thứ tự
              const serverUrls = Array.from(imageUrlMapping.values());
              let urlIndex = 0;

              updatedContentQuestions = updatedContentQuestions.replace(
                /<img([^>]*?)src="data:[^"]*"([^>]*?)>/gi,
                (match, before, after) => {
                  if (urlIndex < serverUrls.length) {
                    const serverUrl = serverUrls[urlIndex];
                    urlIndex++;
                    // Remove data-temp-key và thêm data-uploaded
                    const cleanedBefore = before.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    const cleanedAfter = after.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    return `<img${cleanedBefore}src="${serverUrl}"${cleanedAfter} data-uploaded="true">`;
                  }
                  return match; // Giữ nguyên nếu không còn server URL
                }
              );
            }

            // Tương tự cho subQuestion
            if (
              updatedSubQuestion &&
              /data:[^;]+;base64/g.test(updatedSubQuestion)
            ) {
              const serverUrls = Array.from(imageUrlMapping.values());
              let urlIndex = 0;

              updatedSubQuestion = updatedSubQuestion.replace(
                /<img([^>]*?)src="data:[^"]*"([^>]*?)>/gi,
                (match, before, after) => {
                  if (urlIndex < serverUrls.length) {
                    const serverUrl = serverUrls[urlIndex];
                    urlIndex++;
                    const cleanedBefore = before.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    const cleanedAfter = after.replace(
                      /data-temp-key="[^"]*"\s*/g,
                      ""
                    );
                    return `<img${cleanedBefore}src="${serverUrl}"${cleanedAfter} data-uploaded="true">`;
                  }
                  return match;
                }
              );
            }

            return {
              ...question,
              contentQuestions: updatedContentQuestions,
              subQuestion: updatedSubQuestion,
            };
          }
        );

        // Debug: Log để kiểm tra kết quả thay thế cuối cùng
        console.log("🔍 Final image replacement results:");
        finalUpdatedQuestionsArray.forEach((q, index) => {
          const base64Count = (
            q.contentQuestions.match(/data:[^;]+;base64/g) || []
          ).length;
          const serverUrlCount = (
            q.contentQuestions.match(
              new RegExp(REACT_APP_API_UPLOAD_URL, "g")
            ) || []
          ).length;
          console.log(
            `Question ${
              index + 1
            }: ${base64Count} base64 images, ${serverUrlCount} server URLs`
          );

          if (base64Count > 0) {
            console.warn(
              `⚠️ Question ${
                index + 1
              } still has base64 images - this should not happen!`
            );
          } else {
            console.log(
              `✅ Question ${index + 1}: All images converted to server URLs`
            );
          }
        });

        if (successCount > 0) {
          toast.success(`✅ Upload thành công ${successCount} ảnh lên server!`);
        }
        if (failCount > 0) {
          toast.warning(
            `⚠️ ${failCount} ảnh upload thất bại, sẽ giữ nguyên base64`
          );
        }

        toast.success(successMessage);
        return finalUpdatedQuestionsArray;
      } catch (error) {
        toast.success(successMessage + " (ảnh sử dụng base64)");
        return questionsArray; // Trả về với base64 images nếu upload failed
      }
    } catch (error) {
      console.error("Error processing docx file:", error);
      toast.error("Lỗi khi xử lý file Word: " + error.message);
      return [];
    }
  }

  const validateQuestion = (questionsArray) => {
    let flag = true;
    let messageArr = [];
    const listQ = questionsArray.filter((question) => question?.type !== "MQ");
    if (formQuestionData.type === "TSA") {
      if (
        listQ.length !== 40 &&
        formQuestionData.subject === "TƯ DUY TOÁN HỌC"
      ) {
        flag = false;
        messageArr.push("Đề TƯ DUY TOÁN HỌC phải có đầy đủ 40 câu hỏi");
      } else if (
        listQ.length !== 20 &&
        formQuestionData.subject === "TƯ DUY ĐỌC HIỂU"
      ) {
        flag = false;
        messageArr.push("Đề TƯ DUY ĐỌC HIỂU Lý phải có đầy đủ 20 câu hỏi");
      } else if (
        listQ.length !== 40 &&
        formQuestionData.subject === "TƯ DUY KHOA HỌC"
      ) {
        flag = false;
        messageArr.push("Đề TƯ DUY KHOA HỌC phải có đầy đủ 40 câu hỏi");
      }
    }
    for (let index = 0; index < questionsArray.length; index++) {
      const question = questionsArray[index];
      if (isValidateContentQuestion(question?.contentQuestions)) {
        flag = false;
        messageArr.push(question?.question + ": Nội dung câu hỏi bị sai");
      }
      if (question?.type === "TN") {
        if (
          !question?.contentAnswerA ||
          !question?.contentAnswerB ||
          !question?.contentAnswerC ||
          !question?.contentAnswerD
        ) {
          flag = false;
          messageArr.push(
            question?.question +
              ": Câu trắc nghiệm bị thiếu đáp án A, B, C hoặc D"
          );
        }
      }
      if (question?.type === "TLN_M") {
        if (!question?.contentY1 || !question?.contentY2) {
          flag = false;
          messageArr.push(
            question?.question +
              ": Câu hỏi trả lời nhiều mệnh đề bị thiếu mệnh đề 1, 2"
          );
        }
      } else if (question?.type === "MA") {
        if (!question?.contentC1 || !question?.contentC2) {
          flag = false;
          messageArr.push(
            question?.question +
              ": Câu hỏi chọn nhiều đáp án bị thiếu nội dung đáp án tích chọn 1, 2"
          );
        }
      } else if (question?.type === "DS") {
        if (!question?.contentYA || !question?.contentYB) {
          flag = false;
          messageArr.push(
            question?.question + ": Câu hỏi đúng sai bị thiếu mệnh đề a), b)"
          );
        }
      } else if (question?.type === "KT") {
        if (
          !question?.contentY1 ||
          !question?.contentY2 ||
          !question?.items[0] ||
          !question?.items[1] ||
          !question?.items[2] ||
          !question?.items[4]
        ) {
          flag = false;
          messageArr.push(
            question?.question +
              ": Câu hỏi kéo thả thiếu một số đáp án kéo thả hoặc mệnh đề"
          );
        }
      }
    }
    return { flag, messageArr };
  };
  const handleEditExam = (exam) => {
    setIsEditing(true);
    setFormData({
      ...exam,
      title: exam?.title?.text,
      // startTime: dayjs(exam?.startTime),
      // endTime: dayjs(exam?.endTime),
    });
    setAnswer(exam?.answer);
    setQuestion(exam?.questions[0]);
    const keys = exam?.questions?.map((e) => e.question) || [];
    setListKeys(keys);
    setQuestionsData(exam?.questions);
  };

  const handleChangeContentQuestions = (event) => {
    const { name, value } = event.target;
    setQuestion({
      ...question,
      [name]: value,
    });
    const ques = questionsData.find((e) => e.question === question.question);
    if (ques) {
      ques.contentQuestions = value;
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await activeExam(id);
      toast.success(res.message);
      setListExams(
        listExams.map((exam) =>
          exam?._id === id
            ? {
                ...exam,
                active: !exam.active,
              }
            : exam
        )
      );
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  const handleChangeInputQuestion = (event) => {
    let { name, value } = event.target;
    if (name === "numberOfQuestions" || name === "time") {
      const roundedValue = Math.round(parseFloat(value));
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: isNaN(roundedValue) ? "" : roundedValue,
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    }

    if (value) {
      setErrors({
        ...errors,
        [name]: false,
      });
    }
  };

  const handleChangeDateStartTime = (date) => {
    setFormData({
      ...formQuestionData,
      // startTime: date,
    });
  };

  const handleChangeDateEndTime = (date) => {
    setFormData({
      ...formQuestionData,
      endTime: date,
    });
  };

  const handleInsertExam = async () => {
    if (!validateForm()) {
      return;
    }

    // Validate questionsData trước khi tạo đề thi
    if (questionsData && questionsData.length > 0) {
      const isQuestionsValid =
        formQuestionData.subject === "TIẾNG ANH"
          ? validateQuestionsArrayEN(questionsData)
          : validateQuestionsArrayMath(questionsData);
      if (!isQuestionsValid) {
        toast.error(
          "Vui lòng kiểm tra và hoàn thiện thông tin các câu hỏi trước khi tạo đề thi!"
        );
        return;
      }
    } else {
      toast.error("Vui lòng thêm câu hỏi trước khi tạo đề thi!");
      return;
    }

    const body = {
      ...formQuestionData,
      title: {
        text: formQuestionData.title.toUpperCase(),
        code: toLowerCaseNonAccentVietnamese(
          formQuestionData.title
        ).toUpperCase(),
      },
      answer,
      numberOfQuestions: parseInt(formQuestionData.numberOfQuestions),
      time: parseInt(formQuestionData.time),
      questions: questionsData,
    };

    try {
      const res = await insertOrUpdateExam(body);
      if (res && res.data) {
        setListExams([
          res.data,
          ...listExams.filter((e) => e?._id !== res.data?._id),
        ]);
        handleFetch();
        toast.success(res.message);
        setFormData({
          title: "",
          url: "",
          numberOfQuestions: 0,
          time: 0,
          // startTime: dayjs(new Date()),
          // endTime: dayjs(new Date()),
          subject: "",
          imgUrrl: "",
          module: "",
        });
        setDataInputQuestion("", []);
        setQuestionsData([]);
        setAnswer({});
      }
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0]; // Lấy file từ input

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result); // Parse nội dung JSON
          setAnswer(json); // Cập nhật trạng thái với dữ liệu từ JSON
          toast.success("Upload file đáp án thành công");
        } catch (error) {
          console.error("Error parsing JSON:", error);
          // Xử lý lỗi nếu cần, ví dụ như hiển thị thông báo cho người dùng
        } finally {
          refs.inputRef.current.value = null;
        }
      };

      reader.onerror = (e) => {
        console.error("File could not be read:", e.target.error);
        refs.inputRef.current.value = null;
        // Xử lý lỗi đọc file
      };

      reader.readAsText(file); // Đọc file dưới dạng text
    }
  };

  const validateForm = () => {
    //   title: "",
    // url: "",
    // numberOfQuestions: 0,
    // time: 0,
    // startTime: dayjs(new Date()),
    // endTime: dayjs(new Date()),
    // subject: "TOÁN",
    // imgUrrl: "",
    // module: "",
    if (!formQuestionData.title) {
      toast.error("Vui lòng nhập tên đề thi");
      return false;
    }

    if (!formQuestionData.numberOfQuestions) {
      toast.error("Vui lòng nhập số câu hỏi");
      return false;
    }

    if (!formQuestionData.time) {
      toast.error("Vui lòng nhập thời gian thi");
      return false;
    }

    if (!formQuestionData.subject) {
      toast.error("Vui lòng chọn môn học");
      return false;
    }
    if (!formQuestionData.module) {
      toast.error("Vui lòng module của môn học");
      return false;
    }

    if (Object.keys(answer || {}).length === 0) {
      toast.error("Vui lòng uplpad file đáp án");
      return false;
    }
    return true;
  };
  const handleUpdateExam = async () => {
    // Validate questionsData trước khi cập nhật đề thi
    if (questionsData && questionsData.length > 0) {
      const isQuestionsValid =
        formQuestionData.subject === "TIẾNG ANH"
          ? validateQuestionsArrayEN(questionsData)
          : validateQuestionsArrayMath(questionsData);
      if (!isQuestionsValid) {
        toast.error(
          "Vui lòng kiểm tra và hoàn thiện thông tin các câu hỏi trước khi cập nhật đề thi!"
        );
        return;
      }
    } else {
      toast.error("Vui lòng thêm câu hỏi trước khi cập nhật đề thi!");
      return;
    }

    const body = {
      ...formQuestionData,
      title: {
        text: formQuestionData.title.toUpperCase(),
        code: toLowerCaseNonAccentVietnamese(
          formQuestionData.title
        ).toUpperCase(),
      },
      answer,
      numberOfQuestions: parseInt(formQuestionData.numberOfQuestions),
      time: parseInt(formQuestionData.time),
      questions: questionsData,
    };

    try {
      const res = await insertOrUpdateExam(body);
      if (res && res.data) {
        setListExams(
          listExams.map((e) => (e._id === res.data?._id ? res.data : e))
        );
        handleFetch();
        toast.success(res.message);
        setFormData({
          title: "",
          url: "",
          numberOfQuestions: 0,
          time: 0,
          // startTime: dayjs(new Date()),
          // endTime: dayjs(new Date()),
          subject: "",
          imgUrrl: "",
          module: "",
        });
        setDataInputQuestion("", []);
        setQuestionsData(null);
        setAnswer({});
      }
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(message);
    }
  };

  const handleChangeUploadFileQuestions = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        let data = [];

        // Kiểm tra loại file
        if (file.name.endsWith(".docx")) {
          // Xử lý file .docx
          if (formQuestionData.subject === "TIẾNG ANH") {
            data = await processQuestionsFromDocxEN(file);
          } else if (formQuestionData.subject === "TOÁN") {
            data = await processQuestionsFromDocxMath(file);
          } else {
            toast.error("Vui lòng chọn môn học trước khi upload file .docx");
          }
        } else {
          toast.error("Chỉ hỗ trợ file .docx");
          refs.inputRefQuestion.current.value = null;
          return;
        }

        // Xử lý data từ file .docx
        if (data.length > 0) {
          const keys = data.map((e) => e.question);
          setListKeys(keys);
          setQuestionsData(
            data.map((item, index) => ({
              ...item,
              imageUrl: questionsData[index]?.imageUrl,
            }))
          );
          setDataInputQuestion(keys[0], data);
          toast.dismiss("processing");
          toast.dismiss("uploading");
        }
      } catch (error) {
        console.error("Error processing file:", error);
        toast.dismiss("processing");
        toast.dismiss("uploading");
        toast.error("Lỗi khi xử lý file: " + error.message);
      }

      refs.inputRefQuestion.current.value = null;
    }
  };

  const handleChangeSelectQuestions = (event) => {
    const { name, value } = event.target;
    setDataInputQuestion(value, questionsData);
  };

  const handleChangeInputAnswer = (event) => {
    let { name, value } = event.target;
    if (
      question?.type === "KT" &&
      ["A>", "B>", "C>", "D>", "E>", "F>"].includes(name)
    ) {
      const newItems = question?.items.map((item, i) => {
        if (item.id === name) {
          return { id: name, content: value };
        }
        return { ...item };
      });
      setQuestion({
        ...question,
        items: newItems,
      });
    } else {
      setQuestion({
        ...question,
        [name]: value,
      });

      // Sync với questionsData
      const ques = questionsData.find((e) => e.question === question.question);
      if (ques) {
        ques[name] = value;
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // if (!e.target.value) {
    //   setIsSearch(false);
    // }
  };

  const handleSearch = () => {
    if (searchQuery) {
      setIsSearch(true);
    } else {
      setIsSearch(false);
    }
    setCurrentPage(1); // Reset page on search
    handleFetch(); // Fetch data with query
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (searchQuery) {
        setIsSearch(true);
      } else {
        setIsSearch(false);
      }
      handleSearch(); // Trigger search when Enter is pressed
    }
  };

  // Function validate questionsArray
  const validateQuestionsArrayEN = (questionsArray) => {
    const requiredFields = [
      "question",
      "contentQuestions",
      "type",
      "contentAnswerA",
      "contentAnswerB",
      "contentAnswerC",
      "contentAnswerD",
      "correctAnswer",
    ];

    const errors = [];

    questionsArray.forEach((q, index) => {
      // Chỉ validate cho câu hỏi trắc nghiệm (type = "TN")
      if (q.type === "TN") {
        requiredFields.forEach((field) => {
          const value = q[field];

          // Kiểm tra nếu field bị rỗng hoặc chỉ chứa whitespace
          if (!value || (typeof value === "string" && value.trim() === "")) {
            const fieldName = {
              question: "Câu hỏi",
              contentQuestions: "Nội dung câu hỏi",
              type: "Loại câu hỏi",
              contentAnswerA: "Đáp án A",
              contentAnswerB: "Đáp án B",
              contentAnswerC: "Đáp án C",
              contentAnswerD: "Đáp án D",
              correctAnswer: "Đáp án đúng",
            }[field];

            errors.push(
              `${q.question || `Câu ${index + 1}`}: Thiếu ${fieldName}`
            );
          }
        });
      } else {
        // Với các loại câu hỏi khác, chỉ validate các trường cơ bản
        const basicFields = ["question", "contentQuestions", "type"];
        basicFields.forEach((field) => {
          const value = q[field];
          if (!value || (typeof value === "string" && value.trim() === "")) {
            const fieldName = {
              question: "Câu hỏi",
              contentQuestions: "Nội dung câu hỏi",
              type: "Loại câu hỏi",
            }[field];

            errors.push(
              `${q.question || `Câu ${index + 1}`}: Thiếu ${fieldName}`
            );
          }
        });
      }
    });

    // Hiển thị errors
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast.error(error, {
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      console.log("❌ Validation errors:", errors);
      return false;
    }

    console.log("✅ All questions validated successfully");
    return true;
  };

  // Function validate questionsArray
  const validateQuestionsArrayMath = (questionsArray) => {
    const requiredFields = [
      "question",
      "contentQuestions",
      "type",
      "contentAnswerA",
      "contentAnswerB",
      "contentAnswerC",
      "contentAnswerD",
      "correctAnswer",
    ];

    const errors = [];

    questionsArray.forEach((q, index) => {
      // Chỉ validate cho câu hỏi trắc nghiệm (type = "TN")
      if (q.type === "TN") {
        requiredFields.forEach((field) => {
          const value = q[field];

          // Kiểm tra nếu field bị rỗng hoặc chỉ chứa whitespace
          if (!value || (typeof value === "string" && value.trim() === "")) {
            const fieldName = {
              question: "Câu hỏi",
              contentQuestions: "Nội dung câu hỏi",
              type: "Loại câu hỏi",
              contentAnswerA: "Đáp án A",
              contentAnswerB: "Đáp án B",
              contentAnswerC: "Đáp án C",
              contentAnswerD: "Đáp án D",
              correctAnswer: "Đáp án đúng",
            }[field];

            errors.push(
              `${q.question || `Câu ${index + 1}`}: Thiếu ${fieldName}`
            );
          }
        });
      } else {
        // Với các loại câu hỏi khác, chỉ validate các trường cơ bản
        const basicFields = [
          "question",
          "contentQuestions",
          "type",
          "correctAnswer",
        ];
        basicFields.forEach((field) => {
          const value = q[field];
          if (!value || (typeof value === "string" && value.trim() === "")) {
            const fieldName = {
              question: "Câu hỏi",
              contentQuestions: "Nội dung câu hỏi",
              type: "Loại câu hỏi",
            }[field];

            errors.push(
              `${q.question || `Câu ${index + 1}`}: Thiếu ${fieldName}`
            );
          } else if (
            field === "correctAnswer" &&
            Array.isArray(value) &&
            value.length === 0
          ) {
            errors.push(
              `${q.question || `Câu ${index + 1}`}: Thiếu đáp án đúng`
            );
          }
        });
      }
    });

    // Hiển thị errors
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast.error(error, {
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      console.log("❌ Validation errors:", errors);
      return false;
    }

    console.log("✅ All questions validated successfully");
    return true;
  };

  const handleValidateQuestions = () => {
    if (questionsData && questionsData.length > 0) {
      const isValid =
        formQuestionData.subject === "TIẾNG ANH"
          ? validateQuestionsArrayEN(questionsData)
          : validateQuestionsArrayMath(questionsData);
      if (isValid) {
        toast.success(`✅ Tất cả ${questionsData.length} câu hỏi đều hợp lệ!`);
      }
    } else {
      toast.warning("Chưa có câu hỏi nào để validate!");
    }
  };
  return (
    <>
      <div className="w-full bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-xl">
              <h1 className="text-3xl font-bold text-white text-center flex items-center justify-center">
                <span className="mr-3">📚</span>
                Quản Lý Đề Thi
                <span className="ml-3">✨</span>
              </h1>
              <p className="text-blue-100 text-center mt-2">
                Tạo, chỉnh sửa và quản lý tất cả đề thi trắc nghiệm
              </p>
            </div>
          </div>

          {/* Exam Form */}
          <ExamForm
            formQuestionData={formQuestionData}
            questionsData={questionsData}
            errors={errors}
            handleChangeInputQuestion={handleChangeInputQuestion}
            listKeys={listKeys}
            question={question}
            handleChangeSelectQuestions={handleChangeSelectQuestions}
            refs={refs}
            handleChangeUploadFileQuestions={handleChangeUploadFileQuestions}
            handleChangeContentQuestions={handleChangeContentQuestions}
            handleChangeInputAnswer={handleChangeInputAnswer}
            setOpenDialogQuestion={setOpenDialogQuestion}
            openDialogQuestion={openDialogQuestion}
            setOpenDialogExam={setOpenDialogExam}
            openDialogExam={openDialogExam}
            upLoadImageQuestions={upLoadImageQuestions}
            // handleChangeDateStartTime={handleChangeDateStartTime}
            handleChangeDateEndTime={handleChangeDateEndTime}
            handleFileUpload={handleFileUpload}
            handleInsertExam={handleInsertExam}
            handleUpdateExam={handleUpdateExam}
            upLoadImageExam={upLoadImageExam}
            isEditing={isEditing}
            handleValidateQuestions={handleValidateQuestions}
            answer={answer}
            setAnswer={setAnswer}
          />

          {/* Exam List Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  📋
                </span>
                Danh sách đề thi
              </h2>

              {/* Search Input */}
              <div className="mt-4 flex items-center space-x-3">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm đề thi..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Tên đề thi
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Module
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Môn học
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Thời gian
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {listExams.length > 0 &&
                      listExams.map((exam, index) => (
                        <tr
                          key={exam?._id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <Tooltip title={exam?._id} placement="top">
                              <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                {exam?._id?.slice(0, 5)}...
                                {exam?._id?.slice(-5)}
                              </span>
                            </Tooltip>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {exam?.title?.text}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {exam?.module || ""}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {exam?.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 font-medium">
                              {exam?.time} phút
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {new Date(exam?.createdAt).toLocaleDateString(
                                "vi-VN",
                                configDate
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEditExam(exam)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Chỉnh sửa đề thi"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExam(exam?._id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xóa đề thi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {listExams.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa có đề thi nào
                  </h3>
                  <p className="text-gray-500">
                    Tạo đề thi đầu tiên của bạn ngay bây giờ!
                  </p>
                </div>
              )}

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Trang {isSearch ? "1 / 1" : `${currentPage} / ${totalPages}`}
                  {listExams.length > 0 && (
                    <span className="ml-2 text-gray-500">
                      ({listExams.length} đề thi)
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1 || isSearch}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => (p < totalPages ? p + 1 : p))
                    }
                    disabled={currentPage === totalPages || isSearch}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Tiếp →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
