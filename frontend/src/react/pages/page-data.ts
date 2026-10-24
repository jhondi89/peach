/* HTML 模板挂载点en la `data-*`: Clavees去掉 `data-` anterior缀posterior驼峰名, 值都es字符串, 服务端没给ClaveNoEn.  */
export type PageData = Readonly<Record<string, string | undefined>>;
