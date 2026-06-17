import { getImageProps } from "next/image";

const CONTENT_HOSTS = ["content.churchapps.org", "content.staging.churchapps.org", "content.lessons.church"];

const optimizable = (url: string) => {
  try { return CONTENT_HOSTS.includes(new URL(url).hostname); } catch { return false; }
};


export const b1ImageOptimizer = {
  img: (url: string, sizes?: string) => {
    if (!optimizable(url)) return { src: url };
    const { props } = getImageProps({ alt: "", src: url, width: 1920, height: 1280, sizes });
    return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
  },

  background: (url: string) => {
    if (!optimizable(url)) return `url('${url}')`;
    const { props } = getImageProps({ alt: "", src: url, width: 1920, height: 1280 });
    return `url('${props.src}')`;
  }
};
