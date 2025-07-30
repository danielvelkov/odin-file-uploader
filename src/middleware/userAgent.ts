import { Request, Response, NextFunction } from 'express';

export const setDefaultLayout = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.session.layoutType) return next();

  const isMobile = req.useragent?.isMobile;
  const isTablet = req.useragent?.isTablet;
  const isDesktop = req.useragent?.isDesktop;

  if ((isMobile || isTablet) && !req.session.layoutType)
    req.session.layoutType = 'grid';
  else if (isDesktop && !req.session.layoutType)
    req.session.layoutType = 'list';

  next();
};
